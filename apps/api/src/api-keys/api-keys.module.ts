import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, WorkspaceRoleGuard],
})
export class ApiKeysModule {}
