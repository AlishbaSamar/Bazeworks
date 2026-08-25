import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';
import {
  DEFAULT_GLOBAL_FOOTER,
  DEFAULT_GLOBAL_HEADER,
} from './default-global-components';

const MAX_SLUG_ATTEMPTS = 5;

@Injectable()
export class WebsitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templatesService: TemplatesService,
  ) {}

  async listForWorkspace(workspaceId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);

    const websites = await this.prisma.website.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { pages: true } },
        owner: { select: { name: true } },
      },
    });
    return websites.map(({ _count, ...website }) => ({
      ...website,
      pageCount: _count.pages,
    }));
  }

  async getOverview(workspaceId: string, websiteId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    const website = await this.requireWebsiteInWorkspace(
      workspaceId,
      websiteId,
      {
        pages: { orderBy: { createdAt: 'asc' } },
        owner: { select: { name: true } },
      },
    );
    return website;
  }

  async create(
    workspaceId: string,
    userId: string,
    { name, templateId }: { name: string; templateId?: string },
  ) {
    let pagesToCreate: { name: string; slug: string }[] = [
      { name: 'Home', slug: '/' },
    ];
    if (templateId) {
      const template = await this.templatesService.getWithPages(templateId);
      if (!template) {
        throw new NotFoundException('Template not found');
      }
      pagesToCreate = template.pages.map(({ name: pageName, slug }) => ({
        name: pageName,
        slug,
      }));
    }

    const slug = await this.generateUniqueSlug(workspaceId, name);
    return this.prisma.website.create({
      data: {
        name,
        slug,
        workspaceId,
        ownerId: userId,
        globalHeader: DEFAULT_GLOBAL_HEADER as Prisma.InputJsonValue,
        globalFooter: DEFAULT_GLOBAL_FOOTER as Prisma.InputJsonValue,
        pages: { create: pagesToCreate },
      },
      include: { _count: { select: { pages: true } } },
    });
  }

  async rename(workspaceId: string, websiteId: string, name: string) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.prisma.website.update({
      where: { id: websiteId },
      data: { name },
    });
  }

  async updateTheme(workspaceId: string, websiteId: string, theme: object) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.prisma.website.update({
      where: { id: websiteId },
      data: { theme },
    });
  }

  async updateGlobalHeader(
    workspaceId: string,
    websiteId: string,
    props: object,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.prisma.website.update({
      where: { id: websiteId },
      data: { globalHeader: props },
    });
  }

  async updateGlobalFooter(
    workspaceId: string,
    websiteId: string,
    props: object,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.prisma.website.update({
      where: { id: websiteId },
      data: { globalFooter: props },
    });
  }

  async duplicate(workspaceId: string, websiteId: string, userId: string) {
    const source = await this.requireWebsiteInWorkspace(
      workspaceId,
      websiteId,
      {
        pages: true,
      },
    );

    const slug = await this.generateUniqueSlug(
      workspaceId,
      `${source.name} copy`,
    );
    return this.prisma.website.create({
      data: {
        name: `${source.name} (Copy)`,
        slug,
        workspaceId,
        ownerId: userId,
        theme: source.theme as Prisma.InputJsonValue,
        globalHeader: source.globalHeader as Prisma.InputJsonValue,
        globalFooter: source.globalFooter as Prisma.InputJsonValue,
        pages: {
          create: source.pages.map(
            ({ name, slug: pageSlug, status, content }) => ({
              name,
              slug: pageSlug,
              status,
              content: content as Prisma.InputJsonValue,
            }),
          ),
        },
      },
      include: { _count: { select: { pages: true } } },
    });
  }

  async archive(workspaceId: string, websiteId: string) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    return this.prisma.website.update({
      where: { id: websiteId },
      data: { archivedAt: new Date() },
    });
  }

  async remove(workspaceId: string, websiteId: string) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    await this.prisma.website.delete({ where: { id: websiteId } });
    return { id: websiteId };
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

  /**
   * Every website-scoped mutation must confirm the website actually belongs
   * to the :workspaceId in the URL, not just that the caller has a role in
   * that workspace — otherwise a valid member of workspace A could rename or
   * delete a website that actually belongs to workspace B by guessing its id.
   */
  private async requireWebsiteInWorkspace<
    Include extends Prisma.WebsiteInclude,
  >(
    workspaceId: string,
    websiteId: string,
    include?: Include,
  ): Promise<Prisma.WebsiteGetPayload<{ include: Include }>> {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
      include,
    });
    if (!website || website.workspaceId !== workspaceId) {
      throw new NotFoundException('Website not found');
    }
    return website as Prisma.WebsiteGetPayload<{ include: Include }>;
  }

  private async generateUniqueSlug(
    workspaceId: string,
    name: string,
  ): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'site';

    let slug = base;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const existing = await this.prisma.website.findUnique({
        where: { workspaceId_slug: { workspaceId, slug } },
      });
      if (!existing) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}-${Date.now()}`;
  }
}
