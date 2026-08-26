import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [CollectionsController],
  providers: [CollectionsService, WorkspaceRoleGuard],
})
export class CollectionsModule {}
