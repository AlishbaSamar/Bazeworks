import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { PagesService } from './pages.service';
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
}
