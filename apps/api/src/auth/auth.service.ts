import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { AuthProvider, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '../common/mailer/mailer.service';

const PASSWORD_SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7d

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any,
      },
    );

    const rawRefreshToken = randomBytes(48).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(rawRefreshToken),
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      refreshTokenExpiresAt,
    };
  }

  async signup(fullName: string, email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user = await this.usersService.create({
      email,
      fullName,
      passwordHash,
    });

    await this.sendVerificationEmail(user);

    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async sendVerificationEmail(user: User) {
    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });

    const webAppUrl = this.config.get<string>('WEB_APP_URL');
    const link = `${webAppUrl}/verify-email?token=${rawToken}`;
    await this.mailer.sendVerificationEmail(user.email, link);
  }

  async verifyEmail(rawToken: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Verification link is invalid or has expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);

    return { verified: true };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(user: User) {
    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired, please log in again');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(record.user);
    return { user: this.toPublicUser(record.user), tokens };
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (!user || !user.passwordHash) {
      return { sent: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    const webAppUrl = this.config.get<string>('WEB_APP_URL');
    const link = `${webAppUrl}/reset-password?token=${rawToken}`;
    await this.mailer.sendPasswordResetEmail(user.email, link);

    return { sent: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { reset: true };
  }

  async validateOAuthLogin(
    provider: AuthProvider,
    providerAccountId: string,
    profile: { email: string; fullName: string },
  ) {
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });

    if (existingAccount) {
      return existingAccount.user;
    }

    let user = await this.usersService.findByEmail(profile.email);
    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        fullName: profile.fullName,
      });
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      user.emailVerified = true;
    }

    await this.prisma.oAuthAccount.create({
      data: { provider, providerAccountId, userId: user.id },
    });

    return user;
  }

  publicUser(user: User) {
    return this.toPublicUser(user);
  }
}
