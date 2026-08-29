import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SnapshotPage {
  name: string;
  slug: string;
  status: string;
  order: number;
  content: unknown;
  seo: Record<string, unknown> | null;
  isDynamic: boolean;
  dynamicCollectionSlug: string | null;
  dynamicSlugField: string | null;
}

/**
 * Serves the *live* site — the Publication a website's `livePublicationId`
 * points at (moved by deploy / rollback). Pages come from the frozen
 * snapshot; collection entries are read live (per the Day 11 decision).
 */
@Injectable()
export class RenderService {
  constructor(private readonly prisma: PrismaService) {}

  private async liveSnapshot(websiteId: string) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
      select: { id: true, name: true, livePublicationId: true },
    });
    if (!website || !website.livePublicationId) {
      throw new NotFoundException('This site has not been deployed yet.');
    }
    const publication = await this.prisma.publication.findUnique({
      where: { id: website.livePublicationId },
    });
    if (!publication) {
      throw new NotFoundException('This site has not been deployed yet.');
    }
    return { website, publication };
  }

  async site(websiteId: string) {
    const { publication } = await this.liveSnapshot(websiteId);
    const seo = publication.websiteSeo as Record<string, unknown>;
    return {
      name: seo.name,
      seo: seo.seo,
      logoUrl: seo.logoUrl ?? null,
      faviconUrl: seo.faviconUrl ?? null,
      theme: publication.theme,
      globalHeader: publication.globalHeader,
      globalFooter: publication.globalFooter,
      publicationId: publication.id,
    };
  }

  async resolve(websiteId: string, rawPath: string) {
    const { publication } = await this.liveSnapshot(websiteId);
    const pages = (Array.isArray(publication.pages)
      ? publication.pages
      : []) as unknown as SnapshotPage[];
    const seo = publication.websiteSeo as Record<string, unknown>;

    const common = {
      website: {
        name: seo.name,
        theme: publication.theme,
        globalHeader: publication.globalHeader,
        globalFooter: publication.globalFooter,
        seo: seo.seo,
        logoUrl: seo.logoUrl ?? null,
        faviconUrl: seo.faviconUrl ?? null,
      },
    };

    const path = rawPath && rawPath !== '' ? rawPath : '/';
    const normalized = path.startsWith('/') ? path : `/${path}`;

    const exact = pages.find(
      (p) => p.slug === normalized && p.status === 'PUBLISHED',
    );
    if (exact) {
      return {
        ...common,
        page: {
          name: exact.name,
          slug: exact.slug,
          content: exact.content,
          seo: exact.seo,
          isDynamic: exact.isDynamic,
        },
        entry: null,
        collectionFields: [],
      };
    }

    // Dynamic route: "/blog/hello" -> snapshot page "/blog", live entry "hello".
    const trimmed = normalized.replace(/\/+$/, '') || '/';
    const lastSlash = trimmed.lastIndexOf('/');
    const entrySlug = trimmed.slice(lastSlash + 1);
    const pageSlug = trimmed.slice(0, lastSlash) || '/';
    if (!entrySlug) throw new NotFoundException('Page not found');

    const page = pages.find(
      (p) =>
        p.slug === pageSlug &&
        p.status === 'PUBLISHED' &&
        p.isDynamic &&
        p.dynamicCollectionSlug &&
        p.dynamicSlugField,
    );
    if (!page) throw new NotFoundException('Page not found');

    const collection = await this.prisma.collection.findFirst({
      where: { websiteId, slug: page.dynamicCollectionSlug! },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (!collection) throw new NotFoundException('Page not found');

    const entry = await this.prisma.collectionEntry.findFirst({
      where: {
        collectionId: collection.id,
        status: 'PUBLISHED',
        data: { path: [page.dynamicSlugField!], equals: entrySlug },
      },
      select: { id: true, collectionId: true, data: true, status: true },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    return {
      ...common,
      page: {
        name: page.name,
        slug: pageSlug,
        content: page.content,
        seo: page.seo,
        isDynamic: true,
      },
      entry,
      collectionFields: collection.fields,
    };
  }
}
