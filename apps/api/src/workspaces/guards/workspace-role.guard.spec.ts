import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { WorkspaceRoleGuard } from './workspace-role.guard';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * The single chokepoint every @RequireWorkspaceRole route passes through —
 * covering it here covers role enforcement + cross-workspace rejection for
 * pages, collections, entries, media, publish, api-keys, members, etc.
 */
describe('WorkspaceRoleGuard', () => {
  let prisma: { workspaceMember: { findUnique: jest.Mock } };
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: WorkspaceRoleGuard;

  const ctx = (userId: string | undefined, workspaceId = 'wsA') =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          user: userId ? { id: userId } : undefined,
          params: { workspaceId },
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    prisma = { workspaceMember: { findUnique: jest.fn() } };
    reflector = { getAllAndOverride: jest.fn() };
    guard = new WorkspaceRoleGuard(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  it('is a no-op when the route declares no required roles', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(ctx('u1'))).resolves.toBe(true);
    expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
  });

  it('blocks a VIEWER from an EDITOR-or-above route', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN', 'EDITOR']);
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'VIEWER' });
    await expect(guard.canActivate(ctx('viewer'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows an EDITOR on an EDITOR-or-above route', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN', 'EDITOR']);
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'EDITOR' });
    await expect(guard.canActivate(ctx('editor'))).resolves.toBe(true);
  });

  it('blocks an EDITOR from an ADMIN-only route (delete-style)', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'EDITOR' });
    await expect(guard.canActivate(ctx('editor'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('blocks a user who is not a member of the workspace at all', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN', 'EDITOR']);
    prisma.workspaceMember.findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(ctx('outsider', 'wsB')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: { userId_workspaceId: { userId: 'outsider', workspaceId: 'wsB' } },
    });
  });

  it('rejects when there is no authenticated user', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    await expect(guard.canActivate(ctx(undefined))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
