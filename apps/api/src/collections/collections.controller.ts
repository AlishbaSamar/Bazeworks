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
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { RenameCollectionDto } from './dto/rename-collection.dto';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { UpdateEntryStatusDto } from './dto/update-entry-status.dto';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces/:workspaceId/websites/:websiteId/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  list(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.collectionsService.listForWebsite(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }

  @Get(':collectionId')
  get(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
  ) {
    return this.collectionsService.getWithFields(
      workspaceId,
      websiteId,
      collectionId,
      session.user.id,
    );
  }

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionsService.create(workspaceId, websiteId, dto.name);
  }

  @Patch(':collectionId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  rename(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Body() dto: RenameCollectionDto,
  ) {
    return this.collectionsService.rename(
      workspaceId,
      websiteId,
      collectionId,
      dto.name,
    );
  }

  @Delete(':collectionId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
  ) {
    return this.collectionsService.remove(workspaceId, websiteId, collectionId);
  }

  @Post(':collectionId/fields')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  createField(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Body() dto: CreateFieldDto,
  ) {
    return this.collectionsService.createField(
      workspaceId,
      websiteId,
      collectionId,
      dto,
    );
  }

  @Patch(':collectionId/fields/:fieldId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateField(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.collectionsService.updateField(
      workspaceId,
      websiteId,
      collectionId,
      fieldId,
      dto,
    );
  }

  @Delete(':collectionId/fields/:fieldId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  removeField(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.collectionsService.removeField(
      workspaceId,
      websiteId,
      collectionId,
      fieldId,
    );
  }

  @Get(':collectionId/entries')
  listEntries(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('status') status?: 'DRAFT' | 'PUBLISHED',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.collectionsService.listEntries(
      workspaceId,
      websiteId,
      collectionId,
      session.user.id,
      { cursor, limit: limit ? Number(limit) : undefined, q, status, order },
    );
  }

  @Get(':collectionId/entries/:entryId')
  getEntry(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.collectionsService.getEntry(
      workspaceId,
      websiteId,
      collectionId,
      entryId,
      session.user.id,
    );
  }

  @Post(':collectionId/entries')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  createEntry(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Body() dto: CreateEntryDto,
  ) {
    return this.collectionsService.createEntry(
      workspaceId,
      websiteId,
      collectionId,
      dto.data,
    );
  }

  @Patch(':collectionId/entries/:entryId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateEntry(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.collectionsService.updateEntry(
      workspaceId,
      websiteId,
      collectionId,
      entryId,
      dto.data,
    );
  }

  @Delete(':collectionId/entries/:entryId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  removeEntry(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.collectionsService.removeEntry(
      workspaceId,
      websiteId,
      collectionId,
      entryId,
    );
  }

  @Patch(':collectionId/entries/:entryId/status')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  setEntryStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Param('collectionId') collectionId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateEntryStatusDto,
  ) {
    return this.collectionsService.setEntryStatus(
      workspaceId,
      websiteId,
      collectionId,
      entryId,
      dto.status,
    );
  }
}
