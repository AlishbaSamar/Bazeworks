import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PublishValidation {
  errors: string[];
  warnings: string[];
}

/** Prisma's stored JSON columns are typed `JsonValue` (nullable); writing them
 * straight back needs the non-null `InputJsonValue`. */
function asJson(value: Prisma.JsonValue): Prisma.InputJsonValue {
  // tsc needs the assertion (JsonValue includes null); the typed-lint rule
  // disagrees on necessity — tsc wins.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return (value ?? {}) as Prisma.InputJsonValue;
}

@Injectable()
export class PublishingService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- status ------------------------------------------------------------

  async getStatus(workspaceId: string, websiteId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    const website = await this.requireWebsiteInWorkspace(
      workspaceId,
      websiteId,
    );

    const since = website.lastPublishedAt;
    const pages = await this.prisma.page.findMany({
      where: { websiteId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    });
    const fieldChanged = await this.prisma.collectionField.findFirst({
      where: {
        collection: { websiteId },
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      select: { id: true },
    });
    const collectionChanged = await this.prisma.collection.findFirst({
      where: {
        websiteId,
        ...(since ? { updatedAt: { gt: since } } : {}),
      },
      select: { id: true },
    });

    const changedPages = since
      ? pages.filter((p) => p.updatedAt > since).map((p) => p.name)
      : pages.map((p) => p.name);
    const websiteChanged = since ? website.updatedAt > since : true;

    const lastPublication = await this.prisma.publication.findFirst({
      where: { websiteId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, note: true, createdById: true },
    });

    const hasPendingChanges =
      !since ||
      websiteChanged ||
      changedPages.length > 0 ||
      Boolean(fieldChanged) ||
      Boolean(collectionChanged);

    return {
      lastPublishedAt: website.lastPublishedAt,
      hasPendingChanges,
      websiteChanged,
      changedPages,
      publishedPageCount: pages.filter((p) => p.status === 'PUBLISHED').length,
      lastPublication,
    };
  }

  // ---- validation ------------------------------------------------------------

  private async validate(websiteId: string): Promise<PublishValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const pages = await this.prisma.page.findMany({
      where: { websiteId },
      include: {
        dynamicCollection: { include: { fields: true } },
      },
    });

    const publishedPages = pages.filter((p) => p.status === 'PUBLISHED');
    if (publishedPages.length === 0) {
      errors.push(
        'No pages are published. Publish at least one page before publishing the site.',
      );
    }
    if (!publishedPages.some((p) => p.slug === '/')) {
      warnings.push('The home page ("/") is not published.');
    }

    for (const page of pages) {
      if (!page.isDynamic) continue;
      if (!page.dynamicCollection || !page.dynamicSlugField) {
        errors.push(
          `Dynamic page "${page.name}" is missing its collection binding.`,
        );
        continue;
      }
      const hasField = page.dynamicCollection.fields.some(
        (f) => f.key === page.dynamicSlugField,
      );
      if (!hasField) {
        errors.push(
          `Dynamic page "${page.name}" is bound to a slug field that no longer exists on "${page.dynamicCollection.name}".`,
        );
      }
      if (page.status === 'PUBLISHED') {
        const publishedEntries = await this.prisma.collectionEntry.count({
          where: {
            collectionId: page.dynamicCollectionId!,
            status: 'PUBLISHED',
          },
        });
        if (publishedEntries === 0) {
          warnings.push(
            `Dynamic page "${page.name}" has no published entries to render yet.`,
          );
        }
      }
    }

    return { errors, warnings };
  }

  async dryRun(workspaceId: string, websiteId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.validate(websiteId);
  }

  // ---- publish ------------------------------------------------------------

  async publish(
    workspaceId: string,
    websiteId: string,
    userId: string,
    note?: string,
  ) {
    const website = await this.requireWebsiteInWorkspace(
      workspaceId,
      websiteId,
    );

    const validation = await this.validate(websiteId);
    if (validation.errors.length > 0) {
      throw new BadRequestException({
        message:
          'This website has problems that must be fixed before publishing.',
        validation,
      });
    }

    const [pages, collections] = await Promise.all([
      this.prisma.page.findMany({
        where: { websiteId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: { dynamicCollection: { select: { slug: true } } },
      }),
      this.prisma.collection.findMany({
        where: { websiteId },
        orderBy: { createdAt: 'asc' },
        include: { fields: { orderBy: { order: 'asc' } } },
      }),
    ]);

    const collectionSlugById = new Map(collections.map((c) => [c.id, c.slug]));

    const snapshotPages = pages.map((p) => ({
      name: p.name,
      slug: p.slug,
      status: p.status,
      order: p.order,
      content: p.content,
      seo: p.seo,
      isDynamic: p.isDynamic,
      dynamicCollectionSlug: p.dynamicCollection?.slug ?? null,
      dynamicSlugField: p.dynamicSlugField,
    }));

    const collectionSchemas = collections.map((c) => ({
      name: c.name,
      slug: c.slug,
      fields: c.fields.map((f) => ({
        name: f.name,
        key: f.key,
        type: f.type,
        required: f.required,
        options: f.options,
        relatedCollectionSlug: f.relatedCollectionId
          ? (collectionSlugById.get(f.relatedCollectionId) ?? null)
          : null,
      })),
    }));

    const publication = await this.prisma.$transaction(async (tx) => {
      const created = await tx.publication.create({
        data: {
          websiteId,
          createdById: userId,
          note: note?.trim() || null,
          pages: snapshotPages,
          theme: asJson(website.theme),
          globalHeader: asJson(website.globalHeader),
          globalFooter: asJson(website.globalFooter),
          websiteSeo: {
            seo: website.seo,
            logoUrl: website.logoUrl,
            faviconUrl: website.faviconUrl,
            name: website.name,
            slug: website.slug,
          },
          collectionSchemas: collectionSchemas,
        },
      });
      await tx.website.update({
        where: { id: websiteId },
        data: { lastPublishedAt: created.createdAt, status: 'LIVE' },
      });
      return created;
    });

    return { publication, validation };
  }

  async listPublications(
    workspaceId: string,
    websiteId: string,
    userId: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.prisma.publication.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, note: true, createdById: true },
      take: 50,
    });
  }

  // ---- guards ------------------------------------------------------------

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
