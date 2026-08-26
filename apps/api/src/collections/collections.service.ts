import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { FieldType } from './dto/create-field.dto';

const MAX_SLUG_ATTEMPTS = 5;

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
      include: { _count: { select: { fields: true } } },
    });
    return collections.map(({ _count, ...collection }) => ({
      ...collection,
      fieldCount: _count.fields,
      entryCount: 0, // entries land on Day 8
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
