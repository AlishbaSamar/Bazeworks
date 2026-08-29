import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultContentForPageType } from './page-templates';
import type { PageType } from './dto/create-page.dto';

const MAX_SLUG_ATTEMPTS = 5;

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    workspaceId: string,
    websiteId: string,
    pageId: string,
    userId: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    return this.requirePageInWebsiteInWorkspace(workspaceId, websiteId, pageId);
  }

  async create(
    workspaceId: string,
    websiteId: string,
    { name, pageType }: { name: string; pageType?: PageType },
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const slug = await this.generateUniqueSlug(websiteId, name);
    return this.prisma.page.create({
      data: {
        name,
        slug,
        websiteId,
        content: defaultContentForPageType(pageType) as Prisma.InputJsonValue,
      },
    });
  }

  async rename(
    workspaceId: string,
    websiteId: string,
    pageId: string,
    data: { name?: string; slug?: string },
  ) {
    await this.requirePageInWebsiteInWorkspace(workspaceId, websiteId, pageId);
    if (data.slug) {
      const existing = await this.prisma.page.findUnique({
        where: { websiteId_slug: { websiteId, slug: data.slug } },
      });
      if (existing && existing.id !== pageId) {
        throw new ForbiddenException('A page with this slug already exists');
      }
    }
    return this.prisma.page.update({
      where: { id: pageId },
      data,
    });
  }

  async updateStatus(
    workspaceId: string,
    websiteId: string,
    pageId: string,
    status: 'DRAFT' | 'PUBLISHED',
  ) {
    await this.requirePageInWebsiteInWorkspace(workspaceId, websiteId, pageId);
    return this.prisma.page.update({
      where: { id: pageId },
      data: { status },
    });
  }

  async updateContent(
    workspaceId: string,
    websiteId: string,
    pageId: string,
    content: Record<string, unknown>,
  ) {
    await this.requirePageInWebsiteInWorkspace(workspaceId, websiteId, pageId);
    return this.prisma.page.update({
      where: { id: pageId },
      data: { content: content as Prisma.InputJsonValue },
    });
  }

  async updateSeo(
    workspaceId: string,
    websiteId: string,
    pageId: string,
    seo: object,
  ) {
    await this.requirePageInWebsiteInWorkspace(workspaceId, websiteId, pageId);
    // Drop empty strings so a cleared field falls back to the website
    // default / page name at render time rather than overriding with "".
    const cleaned = Object.fromEntries(
      Object.entries(seo as Record<string, unknown>).filter(
        ([, v]) => v !== '' && v != null,
      ),
    );
    return this.prisma.page.update({
      where: { id: pageId },
      data: { seo: cleaned as Prisma.InputJsonValue },
    });
  }

  async duplicate(workspaceId: string, websiteId: string, pageId: string) {
    const source = await this.requirePageInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      pageId,
    );
    const slug = await this.generateUniqueSlug(
      websiteId,
      `${source.name} copy`,
    );
    return this.prisma.page.create({
      data: {
        name: `${source.name} (Copy)`,
        slug,
        websiteId,
        status: 'DRAFT',
        content: source.content as Prisma.InputJsonValue,
      },
    });
  }

  async remove(workspaceId: string, websiteId: string, pageId: string) {
    await this.requirePageInWebsiteInWorkspace(workspaceId, websiteId, pageId);
    await this.prisma.page.delete({ where: { id: pageId } });
    return { id: pageId };
  }

  async setDynamicBinding(
    workspaceId: string,
    websiteId: string,
    pageId: string,
    input: { isDynamic: boolean; collectionId?: string; slugField?: string },
  ) {
    await this.requirePageInWebsiteInWorkspace(workspaceId, websiteId, pageId);

    if (!input.isDynamic) {
      return this.prisma.page.update({
        where: { id: pageId },
        data: {
          isDynamic: false,
          dynamicCollectionId: null,
          dynamicSlugField: null,
        },
      });
    }

    const collection = await this.prisma.collection.findUnique({
      where: { id: input.collectionId },
      include: { fields: true },
    });
    if (!collection || collection.websiteId !== websiteId) {
      throw new NotFoundException('Collection not found in this website');
    }
    if (!collection.fields.some((f) => f.key === input.slugField)) {
      throw new ForbiddenException(
        "The slug field must be one of the collection's own fields",
      );
    }

    return this.prisma.page.update({
      where: { id: pageId },
      data: {
        isDynamic: true,
        dynamicCollectionId: collection.id,
        dynamicSlugField: input.slugField,
      },
    });
  }

  /**
   * Resolves a path like "/blog/hello-world" to the dynamic Page whose slug
   * is "/blog" and the PUBLISHED entry in its bound collection whose
   * dynamicSlugField value is "hello-world". This is the same logic Day
   * 11/12's preview and production rendering will call — it's authenticated
   * for now because there's no public-facing site yet to call it without a
   * session; that gap gets a deliberately public entry point later.
   */
  async resolveDynamicPage(
    workspaceId: string,
    websiteId: string,
    userId: string,
    path: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);

    // Page slugs are stored with a leading slash — including "/" for the
    // root page — so a root-bound dynamic page's entries live directly at
    // "/entry-slug" with no second path segment. Splitting on the last "/"
    // handles that case too: "/entry-slug" splits to pageSlug "" (normalized
    // to "/" below) and entrySlug "entry-slug", same as "/blog/entry-slug"
    // splits to pageSlug "/blog".
    const trimmed = path.replace(/\/+$/, '') || '/';
    const lastSlash = trimmed.lastIndexOf('/');
    const entrySlug = trimmed.slice(lastSlash + 1);
    if (!entrySlug) {
      throw new NotFoundException('No dynamic page matches this path');
    }
    const pageSlug = trimmed.slice(0, lastSlash) || '/';

    const page = await this.prisma.page.findUnique({
      where: { websiteId_slug: { websiteId, slug: pageSlug } },
    });
    if (
      !page ||
      !page.isDynamic ||
      !page.dynamicCollectionId ||
      !page.dynamicSlugField
    ) {
      throw new NotFoundException('No dynamic page matches this path');
    }

    const entry = await this.prisma.collectionEntry.findFirst({
      where: {
        collectionId: page.dynamicCollectionId,
        status: 'PUBLISHED',
        data: { path: [page.dynamicSlugField], equals: entrySlug },
      },
    });
    if (!entry) {
      throw new NotFoundException('No published entry matches this slug');
    }

    return { page, entry };
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

  /**
   * Confirms the full chain — page belongs to website, website belongs to
   * workspace — so a member of one workspace can't read or overwrite a page
   * that actually lives under a different workspace's website by guessing
   * (or being handed) its id.
   */
  private async requirePageInWebsiteInWorkspace(
    workspaceId: string,
    websiteId: string,
    pageId: string,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page || page.websiteId !== websiteId) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  private async generateUniqueSlug(
    websiteId: string,
    name: string,
  ): Promise<string> {
    const base =
      '/' +
      (name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'page');

    let slug = base;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const existing = await this.prisma.page.findUnique({
        where: { websiteId_slug: { websiteId, slug } },
      });
      if (!existing) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}-${Date.now()}`;
  }
}
