import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { hashKey } from '../api-keys/api-keys.service';

const REFRESH_LAST_USED_AFTER_MS = 5 * 60 * 1000;

export interface HeadlessRequest extends Request {
  apiWebsiteId?: string;
}

/**
 * Authenticates public headless requests with a per-website API key passed as
 * `Authorization: Bearer <key>` or `x-api-key`. On success attaches the key's
 * websiteId to the request; every headless route then scopes its queries to
 * that id, so a key for website A can never read website B (PRD §8.14 / §9.1).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<HeadlessRequest>();

    const header = req.header('authorization');
    const bearer = header?.toLowerCase().startsWith('bearer ')
      ? header.slice(7).trim()
      : undefined;
    const raw = bearer ?? req.header('x-api-key')?.trim();
    if (!raw) {
      throw new UnauthorizedException('Missing API key');
    }

    const key = await this.prisma.apiKey.findFirst({
      where: { hashedKey: hashKey(raw), revokedAt: null },
    });
    if (!key) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    req.apiWebsiteId = key.websiteId;

    if (
      !key.lastUsedAt ||
      Date.now() - key.lastUsedAt.getTime() > REFRESH_LAST_USED_AFTER_MS
    ) {
      void this.prisma.apiKey
        .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {});
    }

    return true;
  }
}
