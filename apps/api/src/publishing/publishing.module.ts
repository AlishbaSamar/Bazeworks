import { Module } from '@nestjs/common';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [PublishingController],
  providers: [PublishingService, WorkspaceRoleGuard],
  exports: [PublishingService],
})
export class PublishingModule {}
