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
import type {
  TemplateFieldDef,
  TemplateEntryDef,
} from '../templates/templates.service';

const MAX_SLUG_ATTEMPTS = 5;

// A template/duplicate copy runs many sequential writes; the default 5s
// interactive-transaction budget is tight for a large template on a
// cold-started database, so give it more room.
const TEMPLATE_COPY_TX_OPTIONS = { timeout: 20_000, maxWait: 10_000 };

/** Portable description of a website's content, used by both template-copy
 * and website-duplicate. Cross-references (RELATION fields, relation-valued
 * entries, dynamic-page bindings) are by slug/handle, never real ids. */
interface CopySpec {
  collections: {
    name: string;
    slug: string;
    order: number;
    fields: TemplateFieldDef[];
    entries: TemplateEntryDef[];
  }[];
  pages: {
    name: string;
    slug: string;
    order: number;
    status?: string;
    content: Prisma.JsonValue;
    isDynamic: boolean;
    dynamicCollectionSlug: string | null;
    dynamicSlugField: string | null;
  }[];
}

function isEmpty(value: Prisma.JsonValue): boolean {
  return (
    value == null ||
    (typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  );
}

// Keys inside Puck component props that hold a collection id (dynamic-content
// components — CollectionList/RecentPosts use `source`, the rest use
// `collectionId`). In a template/duplicate these hold the source collection's
// *slug*; rewrite them to the freshly-created collection's id.
const COLLECTION_REF_KEYS = new Set(['source', 'collectionId']);

function remapContentCollectionRefs(
  content: Prisma.JsonValue,
  collectionIdBySlug: Map<string, string>,
): Prisma.JsonValue {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (
          COLLECTION_REF_KEYS.has(k) &&
          typeof v === 'string' &&
          collectionIdBySlug.has(v)
        ) {
          out[k] = collectionIdBySlug.get(v);
        } else {
          out[k] = walk(v);
        }
      }
      return out;
    }
    return node;
  };
  return walk(content) as Prisma.JsonValue;
}

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
        pages: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
        owner: { select: { name: true } },
        _count: { select: { collections: true } },
      },
    );
    return website;
  }

  async create(
    workspaceId: string,
    userId: string,
    { name, templateId }: { name: string; templateId?: string },
  ) {
    const slug = await this.generateUniqueSlug(workspaceId, name);

    if (!templateId) {
      return this.prisma.website.create({
        data: {
          name,
          slug,
          workspaceId,
          ownerId: userId,
          globalHeader: DEFAULT_GLOBAL_HEADER as Prisma.InputJsonValue,
          globalFooter: DEFAULT_GLOBAL_FOOTER as Prisma.InputJsonValue,
          pages: { create: [{ name: 'Home', slug: '/', order: 0 }] },
        },
        include: { _count: { select: { pages: true } } },
      });
    }

    const template = await this.templatesService.getForCopy(
      templateId,
      workspaceId,
    );

    // One transaction so a partially-copied website can never be left behind
    // if any step fails (PRD §9.4: template-copy failures must not corrupt).
    return this.prisma.$transaction(async (tx) => {
      const website = await tx.website.create({
        data: {
          name,
          slug,
          workspaceId,
          ownerId: userId,
          theme: template.theme as Prisma.InputJsonValue,
          globalHeader: (isEmpty(template.globalHeader)
            ? DEFAULT_GLOBAL_HEADER
            : template.globalHeader) as Prisma.InputJsonValue,
          globalFooter: (isEmpty(template.globalFooter)
            ? DEFAULT_GLOBAL_FOOTER
            : template.globalFooter) as Prisma.InputJsonValue,
        },
      });

      await this.materializeContent(tx, website.id, {
        collections: template.collections,
        pages: template.pages,
      });

      return tx.website.findUniqueOrThrow({
        where: { id: website.id },
        include: { _count: { select: { pages: true } } },
      });
    }, TEMPLATE_COPY_TX_OPTIONS);
  }

  /**
   * Creates the collections, fields, sample entries and pages described by a
   * {@link CopySpec} under an already-created website. RELATION fields and
   * relation-valued entries are resolved in a second pass, since a template's
   * cross-references are by slug/handle, not real ids. Shared by both
   * "create from template" and "duplicate website".
   */
  private async materializeContent(
    tx: Prisma.TransactionClient,
    websiteId: string,
    spec: CopySpec,
  ) {
    const collectionIdBySlug = new Map<string, string>();
    for (const tc of spec.collections) {
      const created = await tx.collection.create({
        data: { name: tc.name, slug: tc.slug, websiteId },
      });
      collectionIdBySlug.set(tc.slug, created.id);
    }

    const relationKeysBySlug = new Map<string, Set<string>>();
    for (const tc of spec.collections) {
      relationKeysBySlug.set(
        tc.slug,
        new Set(
          tc.fields.filter((f) => f.type === 'RELATION').map((f) => f.key),
        ),
      );
      const collectionId = collectionIdBySlug.get(tc.slug)!;
      for (const [i, f] of tc.fields.entries()) {
        await tx.collectionField.create({
          data: {
            collectionId,
            name: f.name,
            key: f.key,
            type: f.type as Prisma.CollectionFieldCreateInput['type'],
            required: f.required ?? false,
            options: f.options ?? [],
            order: f.order ?? i,
            relatedCollectionId:
              f.type === 'RELATION' && f.relatedCollectionSlug
                ? (collectionIdBySlug.get(f.relatedCollectionSlug) ?? null)
                : null,
          },
        });
      }
    }

    // Entries pass 1 — everything except relation values; record each entry's
    // portable "<collectionSlug>/<index>" handle so pass 2 can wire relations.
    const entryIdByHandle = new Map<string, string>();
    for (const tc of spec.collections) {
      const collectionId = collectionIdBySlug.get(tc.slug)!;
      const relationKeys = relationKeysBySlug.get(tc.slug)!;
      for (const [i, e] of tc.entries.entries()) {
        const data: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(e.data ?? {})) {
          if (!relationKeys.has(k)) data[k] = v;
        }
        const created = await tx.collectionEntry.create({
          data: {
            collectionId,
            status: e.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
            data: data as Prisma.InputJsonValue,
          },
        });
        entryIdByHandle.set(e.key ?? `${tc.slug}/${i}`, created.id);
      }
    }

    // Entries pass 2 — fill relation fields now that every handle resolves.
    for (const tc of spec.collections) {
      const relationKeys = relationKeysBySlug.get(tc.slug)!;
      if (relationKeys.size === 0) continue;
      for (const [i, e] of tc.entries.entries()) {
        const entryId = entryIdByHandle.get(e.key ?? `${tc.slug}/${i}`);
        if (!entryId) continue;
        const relData: Record<string, unknown> = {};
        for (const key of relationKeys) {
          const raw = (e.data ?? {})[key] as
            { $entry?: string } | string | undefined;
          const handle =
            raw && typeof raw === 'object' && raw.$entry
              ? raw.$entry
              : undefined;
          const resolved = handle ? entryIdByHandle.get(handle) : undefined;
          if (resolved) relData[key] = resolved;
        }
        if (Object.keys(relData).length === 0) continue;
        const current = await tx.collectionEntry.findUniqueOrThrow({
          where: { id: entryId },
        });
        await tx.collectionEntry.update({
          where: { id: entryId },
          data: {
            data: {
              ...(current.data as Record<string, unknown>),
              ...relData,
            } as Prisma.InputJsonValue,
          },
        });
      }
    }

    for (const [i, p] of spec.pages.entries()) {
      await tx.page.create({
        data: {
          websiteId,
          name: p.name,
          slug: p.slug,
          status: p.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          order: p.order ?? i,
          content: remapContentCollectionRefs(
            p.content,
            collectionIdBySlug,
          ) as Prisma.InputJsonValue,
          isDynamic: p.isDynamic,
          dynamicCollectionId:
            p.isDynamic && p.dynamicCollectionSlug
              ? (collectionIdBySlug.get(p.dynamicCollectionSlug) ?? null)
              : null,
          dynamicSlugField: p.isDynamic ? p.dynamicSlugField : null,
        },
      });
    }
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
        pages: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
        collections: {
          orderBy: { createdAt: 'asc' },
          include: {
            fields: { orderBy: { order: 'asc' } },
            entries: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    );

    const collectionSlugById = new Map(
      source.collections.map((c) => [c.id, c.slug]),
    );
    const entryHandleById = new Map<string, string>();
    source.collections.forEach((c) => {
      c.entries.forEach((e, i) => entryHandleById.set(e.id, `${c.slug}/${i}`));
    });

    const spec: CopySpec = {
      collections: source.collections.map((c, ci) => ({
        name: c.name,
        slug: c.slug,
        order: ci,
        fields: c.fields.map((f) => ({
          name: f.name,
          key: f.key,
          type: f.type,
          required: f.required,
          options: Array.isArray(f.options) ? (f.options as string[]) : [],
          order: f.order,
          relatedCollectionSlug: f.relatedCollectionId
            ? collectionSlugById.get(f.relatedCollectionId)
            : undefined,
        })),
        entries: c.entries.map((e, i) => {
          const data: Record<string, unknown> = {
            ...(e.data as Record<string, unknown>),
          };
          for (const f of c.fields) {
            if (f.type !== 'RELATION') continue;
            const ref = data[f.key];
            if (typeof ref === 'string' && entryHandleById.has(ref)) {
              data[f.key] = { $entry: entryHandleById.get(ref) };
            }
          }
          return { key: `${c.slug}/${i}`, status: e.status, data };
        }),
      })),
      pages: source.pages.map((p, i) => ({
        name: p.name,
        slug: p.slug,
        order: p.order ?? i,
        status: p.status,
        content: p.content,
        isDynamic: p.isDynamic,
        dynamicCollectionSlug: p.dynamicCollectionId
          ? (collectionSlugById.get(p.dynamicCollectionId) ?? null)
          : null,
        dynamicSlugField: p.dynamicSlugField,
      })),
    };

    const slug = await this.generateUniqueSlug(
      workspaceId,
      `${source.name} copy`,
    );

    return this.prisma.$transaction(async (tx) => {
      const website = await tx.website.create({
        data: {
          name: `${source.name} (Copy)`,
          slug,
          workspaceId,
          ownerId: userId,
          theme: source.theme as Prisma.InputJsonValue,
          globalHeader: source.globalHeader as Prisma.InputJsonValue,
          globalFooter: source.globalFooter as Prisma.InputJsonValue,
        },
      });
      await this.materializeContent(tx, website.id, spec);
      return tx.website.findUniqueOrThrow({
        where: { id: website.id },
        include: { _count: { select: { pages: true } } },
      });
    }, TEMPLATE_COPY_TX_OPTIONS);
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
