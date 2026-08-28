import { Module } from '@nestjs/common';
import {
  TemplatesController,
  WorkspaceTemplatesController,
} from './templates.controller';
import { TemplatesService } from './templates.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [TemplatesController, WorkspaceTemplatesController],
  providers: [TemplatesService, WorkspaceRoleGuard],
  exports: [TemplatesService],
})
export class TemplatesModule {}
