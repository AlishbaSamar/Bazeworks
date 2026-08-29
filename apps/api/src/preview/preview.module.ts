import { Module } from '@nestjs/common';
import {
  PreviewLinkController,
  PublicPreviewController,
} from './preview.controller';
import { PreviewService } from './preview.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [PreviewLinkController, PublicPreviewController],
  providers: [PreviewService, WorkspaceRoleGuard],
})
export class PreviewModule {}
