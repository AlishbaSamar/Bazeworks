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
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { RenameWorkspaceDto } from './dto/rename-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
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
  get(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspacesService.getForUser(workspaceId, session.user.id);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  rename(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: RenameWorkspaceDto,
  ) {
    return this.workspacesService.rename(workspaceId, dto.name);
  }

  @Get(':workspaceId/members')
  listMembers(
    @Session() session: AuthSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspacesService.listMembers(workspaceId, session.user.id);
  }

  @Post(':workspaceId/members')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.workspacesService.addMember(workspaceId, dto.email, dto.role);
  }

  @Patch(':workspaceId/members/:memberId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(
      workspaceId,
      memberId,
      dto.role,
    );
  }

  @Delete(':workspaceId/members/:memberId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireWorkspaceRole('OWNER', 'ADMIN')
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(workspaceId, memberId);
  }
}
