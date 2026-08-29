import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { DeploymentsService } from './deployments.service';
import { DeployDto } from './dto/deploy.dto';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces/:workspaceId/websites/:websiteId/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  list(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.deploymentsService.list(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }

  @Get(':deploymentId')
  get(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.deploymentsService.getOne(
      workspaceId,
      websiteId,
      deploymentId,
      session.user.id,
    );
  }

  @Get(':deploymentId/logs')
  logs(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.deploymentsService.logs(
      workspaceId,
      websiteId,
      deploymentId,
      session.user.id,
    );
  }

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  deploy(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: DeployDto,
  ) {
    return this.deploymentsService.deploy(
      workspaceId,
      websiteId,
      session.user.id,
      dto.publicationId,
    );
  }

  @Post(':deploymentId/redeploy')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  redeploy(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.deploymentsService.redeploy(
      workspaceId,
      websiteId,
      deploymentId,
      session.user.id,
    );
  }

  @Post(':deploymentId/cancel')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  cancel(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.deploymentsService.cancel(workspaceId, websiteId, deploymentId);
  }
}
