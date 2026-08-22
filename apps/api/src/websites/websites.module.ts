import { Module } from '@nestjs/common';
import { WebsitesController } from './websites.controller';
import { WebsitesService } from './websites.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [TemplatesModule],
  controllers: [WebsitesController],
  providers: [WebsitesService, WorkspaceRoleGuard],
})
export class WebsitesModule {}
