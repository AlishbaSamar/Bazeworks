import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { TemplatesService } from './templates.service';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../workspaces/decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // Official templates, optionally merged with the given workspace's own.
  @Get()
  list(@Query('workspaceId') workspaceId?: string) {
    return this.templatesService.list(workspaceId);
  }
}

@Controller('workspaces/:workspaceId/templates')
export class WorkspaceTemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string) {
    return this.templatesService.list(workspaceId);
  }

  @Post('from-website/:websiteId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN', 'EDITOR')
  saveFromWebsite(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: SaveAsTemplateDto,
  ) {
    return this.templatesService.createFromWebsite(
      workspaceId,
      websiteId,
      session.user.id,
      dto,
    );
  }

  @Delete(':templateId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.templatesService.remove(workspaceId, templateId);
  }
}
