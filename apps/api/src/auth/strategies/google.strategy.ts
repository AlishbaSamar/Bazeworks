import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthProvider } from '@prisma/client';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });

    if (!clientID || !clientSecret) {
      this.logger.warn(
        'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set — Google sign-in will fail until they are configured in apps/api/.env',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google account has no accessible email'), undefined);
    }

    const user = await this.authService.validateOAuthLogin(
      AuthProvider.google,
      profile.id,
      { email, fullName: profile.displayName ?? email },
    );

    done(null, user);
  }
}
