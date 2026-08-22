import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });
    if (!website || website.workspaceId !== workspaceId) {
      throw new NotFoundException('Website not found');
    }
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page || page.websiteId !== websiteId) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }
}
