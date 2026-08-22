import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WORKSPACE_ROLES_KEY } from '../decorators/require-workspace-role.decorator';

interface RequestWithAuth {
  user?: { id: string };
  params: { workspaceId?: string };
  workspaceMembership?: unknown;
}

/**
 * Enforces @RequireWorkspaceRole(...) on routes with a :workspaceId param.
 * Runs after the global Better Auth guard, so request.user is already set.
 */
@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const userId = request.user?.id;
    const workspaceId = request.params?.workspaceId;
    if (!userId || !workspaceId) {
      throw new ForbiddenException('Workspace context missing');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action in this workspace',
      );
    }

    request.workspaceMembership = membership;
    return true;
  }
}
