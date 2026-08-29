import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { CloudinaryService } from './cloudinary.service';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [MediaController],
  providers: [MediaService, CloudinaryService, WorkspaceRoleGuard],
  exports: [MediaService],
})
export class MediaModule {}
