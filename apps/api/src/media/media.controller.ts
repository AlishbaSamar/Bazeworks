import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { MediaService } from './media.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces/:workspaceId/websites/:websiteId/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  sign(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.mediaService.signUpload(workspaceId, websiteId);
  }

  @Get()
  list(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Query('kind') kind?: string,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mediaService.list(workspaceId, websiteId, session.user.id, {
      kind,
      q,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':assetId')
  get(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.mediaService.get(
      workspaceId,
      websiteId,
      assetId,
      session.user.id,
    );
  }

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  create(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateAssetDto,
  ) {
    return this.mediaService.create(
      workspaceId,
      websiteId,
      session.user.id,
      dto,
    );
  }

  @Patch(':assetId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateAlt(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('assetId') assetId: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.mediaService.updateAlt(
      workspaceId,
      websiteId,
      assetId,
      dto.alt,
    );
  }

  @Delete(':assetId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.mediaService.remove(workspaceId, websiteId, assetId);
  }
}
