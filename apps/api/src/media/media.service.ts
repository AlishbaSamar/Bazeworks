import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CloudinaryService,
  type CloudinaryResourceType,
} from './cloudinary.service';
import type { CreateAssetDto } from './dto/create-asset.dto';

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 60;

// mime -> kind, and the size ceiling per kind. Anything not listed is rejected
// with a specific message (PRD §8.10 / §9.4).
const ALLOWED: Record<string, AssetKind> = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/svg+xml': 'IMAGE',
  'image/avif': 'IMAGE',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'video/quicktime': 'VIDEO',
  'application/pdf': 'DOCUMENT',
};

const SIZE_LIMIT: Record<AssetKind, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 200 * 1024 * 1024,
  DOCUMENT: 25 * 1024 * 1024,
};

export function kindToResourceType(kind: AssetKind): CloudinaryResourceType {
  if (kind === 'IMAGE') return 'image';
  if (kind === 'VIDEO') return 'video';
  return 'raw';
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  signUpload(workspaceId: string, websiteId: string) {
    return this.requireWebsiteInWorkspace(workspaceId, websiteId).then(() => {
      if (!this.cloudinary.configured) {
        throw new BadRequestException(
          'Media storage is not configured on the server.',
        );
      }
      return this.cloudinary.signUpload(websiteId);
    });
  }

  async list(
    workspaceId: string,
    websiteId: string,
    userId: string,
    opts: { kind?: string; q?: string; cursor?: string; limit?: number },
  ) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);

    const take = Math.min(
      Math.max(opts.limit ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );
    const where: Prisma.AssetWhereInput = { websiteId };
    if (opts.kind && opts.kind in SIZE_LIMIT) {
      where.kind = opts.kind as AssetKind;
    }
    const q = opts.q?.trim();
    if (q) where.filename = { contains: q, mode: 'insensitive' };

    const rows = await this.prisma.asset.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > take;
    const assets = hasMore ? rows.slice(0, take) : rows;
    return {
      assets,
      nextCursor: hasMore ? assets[assets.length - 1].id : null,
    };
  }

  async get(
    workspaceId: string,
    websiteId: string,
    assetId: string,
    userId: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.requireAssetInWebsite(assetId, websiteId);
  }

  async create(
    workspaceId: string,
    websiteId: string,
    userId: string,
    dto: CreateAssetDto,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);

    const kind = ALLOWED[dto.mimeType];
    if (!kind) {
      throw new BadRequestException(
        `"${dto.mimeType}" files aren't supported. Upload an image, MP4 video, or PDF.`,
      );
    }
    if (dto.bytes > SIZE_LIMIT[kind]) {
      const mb = Math.round(SIZE_LIMIT[kind] / (1024 * 1024));
      throw new BadRequestException(
        `That file is too large. The limit for ${kind.toLowerCase()}s is ${mb} MB.`,
      );
    }

    return this.prisma.asset.create({
      data: {
        websiteId,
        createdById: userId,
        kind,
        provider: 'cloudinary',
        externalId: dto.externalId,
        url: dto.url,
        filename: dto.filename,
        mimeType: dto.mimeType,
        bytes: dto.bytes,
        width: dto.width ?? null,
        height: dto.height ?? null,
        alt: dto.alt?.trim() ?? '',
      },
    });
  }

  async updateAlt(
    workspaceId: string,
    websiteId: string,
    assetId: string,
    alt: string,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    await this.requireAssetInWebsite(assetId, websiteId);
    return this.prisma.asset.update({
      where: { id: assetId },
      data: { alt: alt.trim() },
    });
  }

  async remove(workspaceId: string, websiteId: string, assetId: string) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const asset = await this.requireAssetInWebsite(assetId, websiteId);
    await this.prisma.asset.delete({ where: { id: assetId } });
    // Best-effort remote cleanup — never blocks the response.
    void this.cloudinary.destroy(
      asset.externalId,
      kindToResourceType(asset.kind),
    );
    return { id: assetId };
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

  private async requireAssetInWebsite(assetId: string, websiteId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });
    if (!asset || asset.websiteId !== websiteId) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }
}
