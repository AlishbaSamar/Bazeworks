import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { MailerService } from '../common/mailer/mailer.service';

const prisma = new PrismaClient();
const mailer = new MailerService();

const PASSWORD_COMPLEXITY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL:
    process.env.API_BASE_URL ??
    `http://localhost:${process.env.PORT ?? '4000'}`,
  basePath: '/api/auth',
  trustedOrigins: [process.env.WEB_APP_URL!],
  advanced: {
    // Frontend (Vercel) and API (Railway) are on different domains, so the
    // session cookie must be SameSite=None to be sent on cross-site fetch
    // calls. Requires Secure, which localhost satisfies too (treated as a
    // secure context by modern browsers) so this is safe for local dev.
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await mailer.sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await mailer.sendVerificationEmail(user.email, url);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  hooks: {
    // createAuthMiddleware requires an async callback; this one never needs to await.
    // eslint-disable-next-line @typescript-eslint/require-await
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') return;
      const body = ctx.body as { password?: string } | undefined;
      const password = body?.password;
      if (!password || !PASSWORD_COMPLEXITY.test(password)) {
        throw new APIError('BAD_REQUEST', {
          message:
            'Password must contain an uppercase letter, a lowercase letter, and a number.',
        });
      }
    }),
  },
});
