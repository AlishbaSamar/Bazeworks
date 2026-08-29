import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Public, Session } from '@thallesp/nestjs-better-auth';
import { PreviewService } from './preview.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces/:workspaceId/websites/:websiteId/preview-link')
export class PreviewLinkController {
  constructor(private readonly previewService: PreviewService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  create(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.previewService.createShareLink(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }
}

/**
 * Public — resolves a preview path for someone holding a valid share token,
 * with no Bazeworks session. Renders the DRAFT, never the last publication.
 */
@Public()
@Controller('public/preview')
export class PublicPreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @Get('resolve')
  resolve(@Query('token') token: string, @Query('path') path?: string) {
    return this.previewService.resolveByToken(token ?? '', path ?? '/');
  }
}
