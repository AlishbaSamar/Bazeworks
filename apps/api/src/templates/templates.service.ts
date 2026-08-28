import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** One field definition inside a TemplateCollection.fields JSON array. */
export interface TemplateFieldDef {
  name: string;
  key: string;
  type: string;
  required?: boolean;
  options?: string[];
  order?: number;
  /** Slug of another collection in the same template (RELATION fields only). */
  relatedCollectionSlug?: string;
}

/** One sample entry inside a TemplateCollection.entries JSON array. */
export interface TemplateEntryDef {
  /** Stable handle used by other entries' relation fields: "<collectionSlug>/<key>". */
  key?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  data: Record<string, unknown>;
}

export interface TemplateForCopy {
  id: string;
  name: string;
  theme: Prisma.JsonValue;
  globalHeader: Prisma.JsonValue;
  globalFooter: Prisma.JsonValue;
  pages: {
    name: string;
    slug: string;
    order: number;
    content: Prisma.JsonValue;
    isDynamic: boolean;
    dynamicCollectionSlug: string | null;
    dynamicSlugField: string | null;
  }[];
  collections: {
    name: string;
    slug: string;
    order: number;
    fields: TemplateFieldDef[];
    entries: TemplateEntryDef[];
  }[];
}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Official templates plus any the caller's workspace has saved for itself.
   * `workspaceId` is optional so the marketing/site-creation flow can still
   * list the official set before a workspace is chosen.
   */
  async list(workspaceId?: string) {
    const templates = await this.prisma.template.findMany({
      where: {
        OR: [
          { isOfficial: true, workspaceId: null },
          ...(workspaceId ? [{ workspaceId }] : []),
        ],
      },
      orderBy: [{ isOfficial: 'desc' }, { createdAt: 'asc' }],
      include: { _count: { select: { pages: true, collections: true } } },
    });
    return templates.map(({ _count, ...template }) => ({
      ...template,
      pageCount: _count.pages,
      collectionCount: _count.collections,
    }));
  }

  /**
   * Full template payload for copying into a new website. Enforces that the
   * caller's workspace may use it: official templates are available to
   * everyone, user templates only inside the workspace that saved them.
   */
  async getForCopy(
    templateId: string,
    workspaceId: string,
  ): Promise<TemplateForCopy> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: {
        pages: { orderBy: { order: 'asc' } },
        collections: { orderBy: { order: 'asc' } },
      },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    if (!template.isOfficial && template.workspaceId !== workspaceId) {
      throw new ForbiddenException(
        'This template belongs to another workspace',
      );
    }

    return {
      id: template.id,
      name: template.name,
      theme: template.theme,
      globalHeader: template.globalHeader,
      globalFooter: template.globalFooter,
      pages: template.pages.map((p) => ({
        name: p.name,
        slug: p.slug,
        order: p.order,
        content: p.content,
        isDynamic: p.isDynamic,
        dynamicCollectionSlug: p.dynamicCollectionSlug,
        dynamicSlugField: p.dynamicSlugField,
      })),
      collections: template.collections.map((c) => ({
        name: c.name,
        slug: c.slug,
        order: c.order,
        fields: (Array.isArray(c.fields)
          ? c.fields
          : []) as unknown as TemplateFieldDef[],
        entries: (Array.isArray(c.entries)
          ? c.entries
          : []) as unknown as TemplateEntryDef[],
      })),
    };
  }

  /**
   * Snapshots an existing website into a reusable user template, owned by the
   * workspace. Pages keep their Puck content; collections keep their field
   * definitions and (up to a cap) their entries as sample content; a dynamic
   * page's collection binding is stored by slug so it survives the copy.
   */
  async createFromWebsite(
    workspaceId: string,
    websiteId: string,
    userId: string,
    input: { name: string; description?: string; category?: string },
  ) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
      include: {
        pages: { orderBy: { createdAt: 'asc' } },
        collections: {
          orderBy: { createdAt: 'asc' },
          include: {
            fields: { orderBy: { order: 'asc' } },
            entries: { orderBy: { createdAt: 'asc' }, take: 25 },
          },
        },
      },
    });
    if (!website || website.workspaceId !== workspaceId) {
      throw new NotFoundException('Website not found');
    }

    const collectionSlugById = new Map(
      website.collections.map((c) => [c.id, c.slug]),
    );
    const entryKeyById = new Map<string, string>();
    for (const collection of website.collections) {
      collection.entries.forEach((entry, i) => {
        entryKeyById.set(entry.id, `${collection.slug}/${i}`);
      });
    }

    const slug = await this.generateUniqueSlug(input.name);

    return this.prisma.template.create({
      data: {
        name: input.name,
        slug,
        description: input.description?.trim() || `Saved from ${website.name}`,
        category: input.category?.trim() || 'Custom',
        kind: 'SITE',
        isOfficial: false,
        workspaceId,
        createdById: userId,
        theme: website.theme as Prisma.InputJsonValue,
        globalHeader: website.globalHeader as Prisma.InputJsonValue,
        globalFooter: website.globalFooter as Prisma.InputJsonValue,
        pages: {
          create: website.pages.map((p, i) => ({
            name: p.name,
            slug: p.slug,
            order: i,
            content: p.content as Prisma.InputJsonValue,
            isDynamic: p.isDynamic,
            dynamicCollectionSlug: p.dynamicCollectionId
              ? (collectionSlugById.get(p.dynamicCollectionId) ?? null)
              : null,
            dynamicSlugField: p.dynamicSlugField,
          })),
        },
        collections: {
          create: website.collections.map((c, ci) => ({
            name: c.name,
            slug: c.slug,
            order: ci,
            fields: c.fields.map((f) => ({
              name: f.name,
              key: f.key,
              type: f.type,
              required: f.required,
              options: f.options,
              order: f.order,
              relatedCollectionSlug: f.relatedCollectionId
                ? (collectionSlugById.get(f.relatedCollectionId) ?? undefined)
                : undefined,
            })),
            entries: c.entries.map((e, i) => ({
              key: `${c.slug}/${i}`,
              status: e.status,
              data: remapRelationRefs(
                e.data as Record<string, unknown>,
                c.fields,
                collectionSlugById,
                entryKeyById,
              ),
            })) as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      include: { _count: { select: { pages: true, collections: true } } },
    });
  }

  async remove(workspaceId: string, templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template || template.workspaceId !== workspaceId) {
      throw new NotFoundException('Template not found');
    }
    if (template.isOfficial) {
      throw new ForbiddenException('Official templates cannot be deleted');
    }
    await this.prisma.template.delete({ where: { id: templateId } });
    return { id: templateId };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'template';

    let slug = base;
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await this.prisma.template.findUnique({
        where: { slug },
      });
      if (!existing) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}-${Date.now()}`;
  }
}

/**
 * Rewrites RELATION field values in a saved entry from real entry ids to the
 * portable "<collectionSlug>/<index>" handles other template entries are
 * stored under, so relations still connect after the template is copied.
 */
function remapRelationRefs(
  data: Record<string, unknown>,
  fields: { key: string; type: string }[],
  _collectionSlugById: Map<string, string>,
  entryKeyById: Map<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (field.type !== 'RELATION') continue;
    const value = data[field.key];
    if (typeof value === 'string' && entryKeyById.has(value)) {
      out[field.key] = { $entry: entryKeyById.get(value) };
    }
  }
  return out;
}
