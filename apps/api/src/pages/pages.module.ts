import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [PagesController],
  providers: [PagesService, WorkspaceRoleGuard],
})
export class PagesModule {}
