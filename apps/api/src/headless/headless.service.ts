import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

@Injectable()
export class HeadlessService {
  constructor(private readonly prisma: PrismaService) {}

  async site(websiteId: string) {
    const website = await this.prisma.website.findUniqueOrThrow({
      where: { id: websiteId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        faviconUrl: true,
        seo: true,
        productionUrl: true,
      },
    });
    return website;
  }

  async pages(websiteId: string) {
    const pages = await this.prisma.page.findMany({
      where: { websiteId, status: 'PUBLISHED' },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        seo: true,
        isDynamic: true,
        updatedAt: true,
      },
    });
    return { pages };
  }

  async page(websiteId: string, path: string) {
    const slug = path.startsWith('/') ? path : `/${path}`;
    const page = await this.prisma.page.findFirst({
      where: { websiteId, slug, status: 'PUBLISHED' },
      select: {
        id: true,
        name: true,
        slug: true,
        seo: true,
        content: true,
        isDynamic: true,
        updatedAt: true,
      },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async collections(websiteId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        fields: {
          orderBy: { order: 'asc' },
          select: {
            name: true,
            key: true,
            type: true,
            required: true,
            options: true,
            relatedCollection: { select: { slug: true, name: true } },
          },
        },
      },
    });
    return { collections };
  }

  private async requireCollection(websiteId: string, slug: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { websiteId, slug },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async entries(
    websiteId: string,
    slug: string,
    opts: { limit?: number; cursor?: string; order?: 'asc' | 'desc' },
  ) {
    const collection = await this.requireCollection(websiteId, slug);
    const take = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const order = opts.order === 'asc' ? 'asc' : 'desc';

    const rows = await this.prisma.collectionEntry.findMany({
      where: { collectionId: collection.id, status: 'PUBLISHED' },
      orderBy: [{ createdAt: order }, { id: order }],
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      select: { id: true, data: true, createdAt: true, updatedAt: true },
    });
    const hasMore = rows.length > take;
    const entries = hasMore ? rows.slice(0, take) : rows;
    return {
      entries,
      nextCursor: hasMore ? entries[entries.length - 1].id : null,
    };
  }

  async entry(websiteId: string, slug: string, entryId: string) {
    const collection = await this.requireCollection(websiteId, slug);
    const entry = await this.prisma.collectionEntry.findFirst({
      where: { id: entryId, collectionId: collection.id, status: 'PUBLISHED' },
      select: { id: true, data: true, createdAt: true, updatedAt: true },
    });
    if (!entry) throw new NotFoundException('Entry not found');
    return entry;
  }
}
