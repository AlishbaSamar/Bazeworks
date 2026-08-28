import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CollectionField, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { FieldType } from './dto/create-field.dto';

const MAX_SLUG_ATTEMPTS = 5;
const DEFAULT_ENTRY_PAGE_SIZE = 25;
const MAX_ENTRY_PAGE_SIZE = 100;
const TEXT_LIKE_FIELD_TYPES: FieldType[] = [
  'TEXT',
  'TEXTAREA',
  'RICH_TEXT',
  'EMAIL',
  'URL',
];

interface FieldInput {
  name: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  relatedCollectionId?: string;
}

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForWebsite(workspaceId: string, websiteId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);

    const collections = await this.prisma.collection.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { fields: true, entries: true } } },
    });
    return collections.map(({ _count, ...collection }) => ({
      ...collection,
      fieldCount: _count.fields,
      entryCount: _count.entries,
    }));
  }

  async getWithFields(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    userId: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    return this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
      {
        fields: {
          orderBy: { order: 'asc' },
          include: { relatedCollection: { select: { id: true, name: true } } },
        },
      },
    );
  }

  async create(workspaceId: string, websiteId: string, name: string) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const slug = await this.generateUniqueSlug(websiteId, name);
    return this.prisma.collection.create({
      data: { name, slug, websiteId },
    });
  }

  async rename(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    name: string,
  ) {
    await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
    );
    return this.prisma.collection.update({
      where: { id: collectionId },
      data: { name },
    });
  }

  async remove(workspaceId: string, websiteId: string, collectionId: string) {
    await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
    );
    await this.prisma.collection.delete({ where: { id: collectionId } });
    return { id: collectionId };
  }

  async createField(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    input: FieldInput,
  ) {
    await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
    );
    if (input.type === 'RELATION') {
      await this.requireRelationTargetInWebsite(
        websiteId,
        input.relatedCollectionId,
      );
    }

    const key = await this.generateUniqueKey(collectionId, input.name);
    const lastField = await this.prisma.collectionField.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.collectionField.create({
      data: {
        name: input.name,
        key,
        type: input.type,
        required: input.required ?? false,
        options: input.options ?? [],
        relatedCollectionId:
          input.type === 'RELATION' ? input.relatedCollectionId : null,
        order: (lastField?.order ?? -1) + 1,
        collectionId,
      },
    });
  }

  async updateField(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    fieldId: string,
    input: Partial<FieldInput>,
  ) {
    await this.requireFieldInCollection(
      workspaceId,
      websiteId,
      collectionId,
      fieldId,
    );

    const nextType = input.type;
    if (nextType === 'RELATION') {
      await this.requireRelationTargetInWebsite(
        websiteId,
        input.relatedCollectionId,
      );
    }

    return this.prisma.collectionField.update({
      where: { id: fieldId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.required !== undefined && { required: input.required }),
        ...(input.options !== undefined && {
          options: input.options as Prisma.InputJsonValue,
        }),
        ...(nextType === 'RELATION'
          ? { relatedCollectionId: input.relatedCollectionId }
          : nextType !== undefined
            ? { relatedCollectionId: null }
            : {}),
      },
    });
  }

  async removeField(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    fieldId: string,
  ) {
    await this.requireFieldInCollection(
      workspaceId,
      websiteId,
      collectionId,
      fieldId,
    );
    await this.prisma.collectionField.delete({ where: { id: fieldId } });
    return { id: fieldId };
  }

  async listEntries(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    userId: string,
    options: {
      cursor?: string;
      limit?: number;
      q?: string;
      status?: 'DRAFT' | 'PUBLISHED';
      order?: 'asc' | 'desc';
      sort?: 'createdAt' | 'updatedAt';
    },
  ) {
    await this.requireMembership(workspaceId, userId);
    const collection = await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
      { fields: true },
    );

    const take = Math.min(
      Math.max(options.limit ?? DEFAULT_ENTRY_PAGE_SIZE, 1),
      MAX_ENTRY_PAGE_SIZE,
    );

    const where: Prisma.CollectionEntryWhereInput = { collectionId };
    if (options.status) where.status = options.status;
    const q = options.q?.trim();
    if (q) {
      const textKeys = collection.fields
        .filter((field) => TEXT_LIKE_FIELD_TYPES.includes(field.type))
        .map((field) => field.key);
      if (textKeys.length === 0) {
        // No text-like fields to search — return an empty page rather than
        // silently ignoring the search term and showing unfiltered results.
        return { entries: [], nextCursor: null };
      }
      where.OR = textKeys.map((key) => ({
        data: {
          path: [key],
          string_contains: q,
          mode: 'insensitive',
        },
      }));
    }

    const order = options.order === 'asc' ? 'asc' : 'desc';
    const sortField = options.sort === 'updatedAt' ? 'updatedAt' : 'createdAt';
    const rows = await this.prisma.collectionEntry.findMany({
      where,
      // `id` is the tiebreaker so the cursor stays stable when two entries
      // share a timestamp.
      orderBy: [{ [sortField]: order }, { id: order }],
      take: take + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const entries = hasMore ? rows.slice(0, take) : rows;

    return {
      entries,
      nextCursor: hasMore ? entries[entries.length - 1].id : null,
    };
  }

  async getEntry(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    entryId: string,
    userId: string,
  ) {
    await this.requireMembership(workspaceId, userId);
    await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
    );
    return this.requireEntryInCollection(entryId, collectionId);
  }

  async createEntry(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    data: Record<string, unknown>,
  ) {
    const collection = await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
      { fields: true },
    );
    const cleaned = await this.validateEntryData(collection.fields, data);
    return this.prisma.collectionEntry.create({
      data: { collectionId, data: cleaned as Prisma.InputJsonValue },
    });
  }

  async updateEntry(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    entryId: string,
    data: Record<string, unknown>,
  ) {
    const collection = await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
      { fields: true },
    );
    await this.requireEntryInCollection(entryId, collectionId);
    const cleaned = await this.validateEntryData(collection.fields, data);
    return this.prisma.collectionEntry.update({
      where: { id: entryId },
      data: { data: cleaned as Prisma.InputJsonValue },
    });
  }

  async removeEntry(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    entryId: string,
  ) {
    await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
    );
    await this.requireEntryInCollection(entryId, collectionId);
    await this.prisma.collectionEntry.delete({ where: { id: entryId } });
    return { id: entryId };
  }

  async setEntryStatus(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    entryId: string,
    status: 'DRAFT' | 'PUBLISHED',
  ) {
    await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
    );
    await this.requireEntryInCollection(entryId, collectionId);
    return this.prisma.collectionEntry.update({
      where: { id: entryId },
      data: { status },
    });
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

  private async requireCollectionInWebsiteInWorkspace<
    Include extends Prisma.CollectionInclude,
  >(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    include?: Include,
  ) {
    await this.requireWebsiteInWorkspace(workspaceId, websiteId);
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      include,
    });
    if (!collection || collection.websiteId !== websiteId) {
      throw new NotFoundException('Collection not found');
    }
    return collection as Prisma.CollectionGetPayload<{ include: Include }>;
  }

  private async requireFieldInCollection(
    workspaceId: string,
    websiteId: string,
    collectionId: string,
    fieldId: string,
  ) {
    await this.requireCollectionInWebsiteInWorkspace(
      workspaceId,
      websiteId,
      collectionId,
    );
    const field = await this.prisma.collectionField.findUnique({
      where: { id: fieldId },
    });
    if (!field || field.collectionId !== collectionId) {
      throw new NotFoundException('Field not found');
    }
    return field;
  }

  private async requireEntryInCollection(
    entryId: string,
    collectionId: string,
  ) {
    const entry = await this.prisma.collectionEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry || entry.collectionId !== collectionId) {
      throw new NotFoundException('Entry not found');
    }
    return entry;
  }

  private async validateEntryData(
    fields: CollectionField[],
    rawData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const errors: string[] = [];
    const cleaned: Record<string, unknown> = {};

    for (const field of fields) {
      const value = rawData[field.key];
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        if (field.required) errors.push(`${field.name} is required`);
        continue;
      }

      switch (field.type) {
        case 'TEXT':
        case 'TEXTAREA':
        case 'RICH_TEXT':
        case 'IMAGE':
        case 'FILE':
          if (typeof value !== 'string') {
            errors.push(`${field.name} must be text`);
            break;
          }
          cleaned[field.key] = value;
          break;

        case 'URL':
          if (typeof value !== 'string' || !/^https?:\/\/.+/i.test(value)) {
            errors.push(`${field.name} must be a valid URL`);
            break;
          }
          cleaned[field.key] = value;
          break;

        case 'EMAIL':
          if (
            typeof value !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ) {
            errors.push(`${field.name} must be a valid email address`);
            break;
          }
          cleaned[field.key] = value;
          break;

        case 'NUMBER': {
          const num = typeof value === 'number' ? value : Number(value);
          if (!Number.isFinite(num)) {
            errors.push(`${field.name} must be a number`);
            break;
          }
          cleaned[field.key] = num;
          break;
        }

        case 'BOOLEAN':
          if (typeof value !== 'boolean') {
            errors.push(`${field.name} must be true or false`);
            break;
          }
          cleaned[field.key] = value;
          break;

        case 'DATE':
        case 'DATE_TIME': {
          const date = new Date(value as string);
          if (Number.isNaN(date.getTime())) {
            errors.push(`${field.name} must be a valid date`);
            break;
          }
          cleaned[field.key] = date.toISOString();
          break;
        }

        case 'SELECT': {
          const options = Array.isArray(field.options)
            ? (field.options as string[])
            : [];
          if (typeof value !== 'string' || !options.includes(value)) {
            errors.push(`${field.name} must be one of its defined options`);
            break;
          }
          cleaned[field.key] = value;
          break;
        }

        case 'MULTI_SELECT': {
          const options = Array.isArray(field.options)
            ? (field.options as string[])
            : [];
          if (
            !Array.isArray(value) ||
            !value.every((v) => typeof v === 'string' && options.includes(v))
          ) {
            errors.push(`${field.name} must only contain its defined options`);
            break;
          }
          cleaned[field.key] = value;
          break;
        }

        case 'RELATION': {
          if (typeof value !== 'string') {
            errors.push(`${field.name} must reference a single entry`);
            break;
          }
          const target = await this.prisma.collectionEntry.findUnique({
            where: { id: value },
          });
          if (!target || target.collectionId !== field.relatedCollectionId) {
            errors.push(`${field.name} references an entry that doesn't exist`);
            break;
          }
          cleaned[field.key] = value;
          break;
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }
    return cleaned;
  }

  private async requireRelationTargetInWebsite(
    websiteId: string,
    relatedCollectionId: string | undefined,
  ) {
    if (!relatedCollectionId) {
      throw new BadRequestException(
        'A relation field needs a related collection',
      );
    }
    const target = await this.prisma.collection.findUnique({
      where: { id: relatedCollectionId },
    });
    if (!target || target.websiteId !== websiteId) {
      throw new NotFoundException('Related collection not found');
    }
  }

  private async generateUniqueSlug(
    websiteId: string,
    name: string,
  ): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'collection';

    let slug = base;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const existing = await this.prisma.collection.findUnique({
        where: { websiteId_slug: { websiteId, slug } },
      });
      if (!existing) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}-${Date.now()}`;
  }

  private async generateUniqueKey(
    collectionId: string,
    name: string,
  ): Promise<string> {
    const words = name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
    const base =
      words.length === 0
        ? 'field'
        : words
            .map((w, i) =>
              i === 0
                ? w.toLowerCase()
                : w[0].toUpperCase() + w.slice(1).toLowerCase(),
            )
            .join('');

    let key = base;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const existing = await this.prisma.collectionField.findUnique({
        where: { collectionId_key: { collectionId, key } },
      });
      if (!existing) return key;
      key = `${base}${attempt + 2}`;
    }
    return `${base}${Date.now()}`;
  }
}
