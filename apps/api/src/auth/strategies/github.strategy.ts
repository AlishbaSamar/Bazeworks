import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
// passport-github2 ships without types matching Strategy's generic profile shape exactly.
import { Strategy } from 'passport-github2';
import { AuthProvider } from '@prisma/client';
import { AuthService } from '../auth.service';

interface GitHubProfile {
  id: string;
  displayName?: string;
  username?: string;
  emails?: { value: string }[];
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = config.get<string>('GITHUB_CLIENT_SECRET');

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL')!,
      scope: ['user:email'],
    });

    if (!clientID || !clientSecret) {
      this.logger.warn(
        'GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are not set — GitHub sign-in will fail until they are configured in apps/api/.env',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
    done: (err: Error | null, user?: unknown) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(
        new Error(
          'GitHub account has no public email — add one at github.com/settings/emails',
        ),
      );
    }

    const user = await this.authService.validateOAuthLogin(
      AuthProvider.github,
      profile.id,
      { email, fullName: profile.displayName ?? profile.username ?? email },
    );

    done(null, user);
  }
}
