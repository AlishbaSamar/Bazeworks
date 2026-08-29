import { Module } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { VercelService } from './vercel.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [DeploymentsController],
  providers: [DeploymentsService, VercelService, WorkspaceRoleGuard],
})
export class DeploymentsModule {}
