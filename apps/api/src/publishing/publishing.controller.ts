import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { PublishingService } from './publishing.service';
import { PublishDto } from './dto/publish.dto';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces/:workspaceId/websites/:websiteId')
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Get('publish/status')
  status(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.publishingService.getStatus(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }

  @Get('publish/check')
  check(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.publishingService.dryRun(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }

  @Post('publish')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  publish(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: PublishDto,
  ) {
    return this.publishingService.publish(
      workspaceId,
      websiteId,
      session.user.id,
      dto.note,
    );
  }

  @Get('publications')
  history(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.publishingService.listPublications(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }
}
