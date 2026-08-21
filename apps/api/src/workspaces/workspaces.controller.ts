import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { RenameWorkspaceDto } from './dto/rename-workspace.dto';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { RequireWorkspaceRole } from './decorators/require-workspace-role.decorator';

interface AuthSession {
  user: { id: string };
}

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Session() session: AuthSession, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(session.user.id, dto.name);
  }

  @Get()
  list(@Session() session: AuthSession) {
    return this.workspacesService.listForUser(session.user.id);
  }

  @Get(':workspaceId')
  get(@Session() session: AuthSession, @Param('workspaceId') workspaceId: string) {
    return this.workspacesService.getForUser(workspaceId, session.user.id);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  rename(@Param('workspaceId') workspaceId: string, @Body() dto: RenameWorkspaceDto) {
    return this.workspacesService.rename(workspaceId, dto.name);
  }
}
