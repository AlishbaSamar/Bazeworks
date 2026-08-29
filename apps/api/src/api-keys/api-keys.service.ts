import { randomBytes, createHash } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ApiKey } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

const KEY_PREFIX = 'bzw_';

/** Public shape of an API key — the hash never leaves the service. */
function publicKey(k: ApiKey) {
  return {
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    lastUsedAt: k.lastUsedAt,
    revokedAt: k.revokedAt,
    createdAt: k.createdAt,
    websiteId: k.websiteId,
    createdById: k.createdById,
  };
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, websiteId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const keys = await this.prisma.apiKey.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map(publicKey);
  }

  async create(
    workspaceId: string,
    websiteId: string,
    userId: string,
    name: string,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);

    const secret = randomBytes(24).toString('base64url');
    const fullKey = `${KEY_PREFIX}${secret}`;
    const prefix = fullKey.slice(0, 12);

    const record = await this.prisma.apiKey.create({
      data: {
        websiteId,
        createdById: userId,
        name: name.trim(),
        prefix,
        hashedKey: hashKey(fullKey),
      },
    });
    // Plaintext is returned exactly once — never stored, never logged.
    return { ...publicKey(record), key: fullKey };
  }

  async revoke(workspaceId: string, websiteId: string, keyId: string) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const key = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key || key.websiteId !== websiteId) {
      throw new NotFoundException('API key not found');
    }
    if (key.revokedAt) return { id: keyId };
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
    return { id: keyId };
  }

  private async requireMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
    return membership;
  }

  private async requireWebsiteInWorkspace(
    workspaceId: string,
    websiteId: string,
  ) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });
    if (!website || website.workspaceId !== workspaceId) {
      throw new NotFoundException('Website not found');
    }
    return website;
  }
}
