import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { signPreviewToken, verifyPreviewToken } from './preview-token';

const SHARE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class PreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createShareLink(
    workspaceId: string,
    websiteId: string,
    userId: string,
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });
    if (!website || website.workspaceId !== workspaceId) {
      throw new NotFoundException('Website not found');
    }

    const token = signPreviewToken(websiteId, SHARE_TTL_SECONDS);
    const webBase = (
      this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
    return {
      token,
      url: `${webBase}/p/${token}`,
      expiresAt: new Date(Date.now() + SHARE_TTL_SECONDS * 1000).toISOString(),
    };
  }

  /**
   * Resolves a path against the DRAFT rows (preview always shows the working
   * copy, never the last Publication). Auth is either a valid share token or
   * the caller must be handled upstream — this method just needs the id.
   */
  async resolveByToken(token: string, path: string) {
    const verified = verifyPreviewToken(token);
    if (!verified) {
      throw new ForbiddenException('This preview link is invalid or expired.');
    }
    return this.resolve(verified.websiteId, path);
  }

  async resolve(websiteId: string, rawPath: string) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
      select: {
        id: true,
        name: true,
        theme: true,
        globalHeader: true,
        globalFooter: true,
        seo: true,
        logoUrl: true,
        faviconUrl: true,
      },
    });
    if (!website) throw new NotFoundException('Website not found');

    const path = rawPath && rawPath !== '' ? rawPath : '/';
    const normalized = path.startsWith('/') ? path : `/${path}`;

    const exact = await this.prisma.page.findFirst({
      where: { websiteId, slug: normalized },
      select: {
        id: true,
        name: true,
        slug: true,
        content: true,
        seo: true,
        isDynamic: true,
      },
    });
    if (exact) {
      return { website, page: exact, entry: null };
    }

    // Try as a dynamic route: split "/blog/hello" -> page "/blog", entry "hello".
    const trimmed = normalized.replace(/\/+$/, '') || '/';
    const lastSlash = trimmed.lastIndexOf('/');
    const entrySlug = trimmed.slice(lastSlash + 1);
    const pageSlug = trimmed.slice(0, lastSlash) || '/';
    if (!entrySlug) throw new NotFoundException('No page matches this path');

    const page = await this.prisma.page.findFirst({
      where: { websiteId, slug: pageSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        content: true,
        seo: true,
        isDynamic: true,
        dynamicCollectionId: true,
        dynamicSlugField: true,
      },
    });
    if (
      !page ||
      !page.isDynamic ||
      !page.dynamicCollectionId ||
      !page.dynamicSlugField
    ) {
      throw new NotFoundException('No page matches this path');
    }

    const entry = await this.prisma.collectionEntry.findFirst({
      where: {
        collectionId: page.dynamicCollectionId,
        data: { path: [page.dynamicSlugField], equals: entrySlug },
      },
      select: {
        id: true,
        collectionId: true,
        data: true,
        status: true,
      },
    });
    if (!entry) throw new NotFoundException('No entry matches this slug');

    const collectionFields = await this.prisma.collectionField.findMany({
      where: { collectionId: page.dynamicCollectionId },
      orderBy: { order: 'asc' },
    });

    return {
      website,
      page: { ...page, slug: pageSlug },
      entry,
      collectionFields,
    };
  }
}
