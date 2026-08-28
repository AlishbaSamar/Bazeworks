import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AssignableRole } from './dto/add-member.dto';

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
      include: {
        workspace: { include: { _count: { select: { members: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ workspace, role }) => {
      const { _count, ...rest } = workspace;
      return { ...rest, role, memberCount: _count.members };
    });
  }

  async getForUser(workspaceId: string, userId: string) {
    const membership = await this.requireMembership(workspaceId, userId);
    return { ...membership.workspace, role: membership.role };
  }

  async rename(workspaceId: string, name: string) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }

  // ---- Membership management (PRD §8.2) ----

  async listMembers(workspaceId: string, userId: string) {
    await this.requireMembership(workspaceId, userId);
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
    }));
  }

  async addMember(workspaceId: string, email: string, role: AssignableRole) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException(
        'No Bazeworks account uses that email address. Ask them to sign up first.',
      );
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });
    if (existing) {
      throw new BadRequestException(
        'That person is already a member of this workspace.',
      );
    }

    const member = await this.prisma.workspaceMember.create({
      data: { workspaceId, userId: user.id, role: role },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    return {
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
    };
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: AssignableRole,
  ) {
    const member = await this.requireMemberOfWorkspace(workspaceId, memberId);
    if (member.role === 'OWNER') {
      throw new BadRequestException(
        "The workspace owner's role can't be changed.",
      );
    }
    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: role },
    });
  }

  async removeMember(workspaceId: string, memberId: string) {
    const member = await this.requireMemberOfWorkspace(workspaceId, memberId);
    if (member.role === 'OWNER') {
      throw new BadRequestException(
        "The workspace owner can't be removed. Transfer ownership first.",
      );
    }
    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
    return { id: memberId };
  }

  private async requireMemberOfWorkspace(
    workspaceId: string,
    memberId: string,
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }
    return member;
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
      const existing = await this.prisma.workspace.findUnique({
        where: { slug },
      });
      if (!existing) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}-${Date.now()}`;
  }
}
