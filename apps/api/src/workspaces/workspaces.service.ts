import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_SLUG_ATTEMPTS = 5;

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string) {
    const slug = await this.generateUniqueSlug(name);
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        slug,
        members: { create: { userId, role: 'OWNER' } },
      },
    });
    return { ...workspace, role: 'OWNER' as const };
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ workspace, role }) => ({ ...workspace, role }));
  }

  async getForUser(workspaceId: string, userId: string) {
    const membership = await this.requireMembership(workspaceId, userId);
    return { ...membership.workspace, role: membership.role };
  }

  async rename(workspaceId: string, name: string) {
    return this.prisma.workspace.update({ where: { id: workspaceId }, data: { name } });
  }

  private async requireMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { workspace: true },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
    return membership;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'workspace';

    let slug = base;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const existing = await this.prisma.workspace.findUnique({ where: { slug } });
      if (!existing) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}-${Date.now()}`;
  }
}
