import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { WebsitesService } from './websites.service';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { RenameWebsiteDto } from './dto/rename-website.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { UpdateGlobalComponentDto } from './dto/update-global-component.dto';
import { UpdateWebsiteSeoDto } from './dto/update-website-seo.dto';
import { UpdateWebsiteIdentityDto } from './dto/update-website-identity.dto';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces/:workspaceId/websites')
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Get()
  list(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.websitesService.listForWorkspace(workspaceId, session.user.id);
  }

  @Get(':websiteId')
  getOverview(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.websitesService.getOverview(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  create(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWebsiteDto,
  ) {
    return this.websitesService.create(workspaceId, session.user.id, dto);
  }

  @Patch(':websiteId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  rename(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: RenameWebsiteDto,
  ) {
    return this.websitesService.rename(workspaceId, websiteId, dto.name);
  }

  @Patch(':websiteId/theme')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateTheme(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: UpdateThemeDto,
  ) {
    return this.websitesService.updateTheme(workspaceId, websiteId, dto);
  }

  @Patch(':websiteId/seo')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateSeo(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: UpdateWebsiteSeoDto,
  ) {
    return this.websitesService.updateSeo(workspaceId, websiteId, dto);
  }

  @Patch(':websiteId/identity')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateIdentity(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: UpdateWebsiteIdentityDto,
  ) {
    return this.websitesService.updateIdentity(workspaceId, websiteId, dto);
  }

  @Patch(':websiteId/global-header')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateGlobalHeader(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: UpdateGlobalComponentDto,
  ) {
    return this.websitesService.updateGlobalHeader(
      workspaceId,
      websiteId,
      dto.props,
    );
  }

  @Patch(':websiteId/global-footer')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  updateGlobalFooter(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: UpdateGlobalComponentDto,
  ) {
    return this.websitesService.updateGlobalFooter(
      workspaceId,
      websiteId,
      dto.props,
    );
  }

  @Post(':websiteId/duplicate')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  duplicate(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.websitesService.duplicate(
      workspaceId,
      websiteId,
      session.user.id,
    );
  }

  @Post(':websiteId/archive')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  archive(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.websitesService.archive(workspaceId, websiteId);
  }

  @Delete(':websiteId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.websitesService.remove(workspaceId, websiteId);
  }
}
