import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { RenamePageDto } from './dto/rename-page.dto';
import { UpdatePageStatusDto } from './dto/update-page-status.dto';
import { UpdatePageContentDto } from './dto/update-page-content.dto';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces/:workspaceId/websites/:websiteId/pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(':pageId')
  get(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pagesService.get(
      workspaceId,
      websiteId,
      pageId,
      session.user.id,
    );
  }

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: CreatePageDto,
  ) {
    return this.pagesService.create(workspaceId, websiteId, dto);
  }

  @Patch(':pageId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateContent(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
    @Body() dto: UpdatePageContentDto,
  ) {
    return this.pagesService.updateContent(
      workspaceId,
      websiteId,
      pageId,
      dto.content,
    );
  }

  @Patch(':pageId/rename')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  rename(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
    @Body() dto: RenamePageDto,
  ) {
    return this.pagesService.rename(workspaceId, websiteId, pageId, dto);
  }

  @Patch(':pageId/status')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
    @Body() dto: UpdatePageStatusDto,
  ) {
    return this.pagesService.updateStatus(
      workspaceId,
      websiteId,
      pageId,
      dto.status,
    );
  }

  @Post(':pageId/duplicate')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  duplicate(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pagesService.duplicate(workspaceId, websiteId, pageId);
  }

  @Delete(':pageId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pagesService.remove(workspaceId, websiteId, pageId);
  }
}
