import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Member-management authorization and integrity rules (PRD §8.2). Uses a
 * hand-rolled Prisma double so the checks are exercised without a database.
 */
describe('WorkspacesService — membership', () => {
  let prisma: {
    workspaceMember: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };
  let service: WorkspacesService;

  beforeEach(() => {
    prisma = {
      workspaceMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };
    service = new WorkspacesService(prisma as unknown as PrismaService);
  });

  describe('addMember', () => {
    it('rejects an email with no Bazeworks account', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.addMember('ws1', 'nobody@example.com', 'EDITOR'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects someone already in the workspace', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ id: 'm1' });
      await expect(
        service.addMember('ws1', 'dupe@example.com', 'EDITOR'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the membership with the requested role', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.workspaceMember.findUnique.mockResolvedValue(null);
      prisma.workspaceMember.create.mockResolvedValue({
        id: 'm2',
        role: 'EDITOR',
        createdAt: new Date(),
        userId: 'u1',
        user: { id: 'u1', name: 'Dana', email: 'd@e.com', image: null },
      });

      const result = await service.addMember('ws1', ' D@E.com ', 'EDITOR');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'd@e.com' },
      });
      expect(prisma.workspaceMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { workspaceId: 'ws1', userId: 'u1', role: 'EDITOR' },
        }),
      );
      expect(result).toMatchObject({ id: 'm2', role: 'EDITOR', name: 'Dana' });
    });
  });

  describe('updateMemberRole', () => {
    it('404s when the member belongs to a different workspace', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'm1',
        workspaceId: 'other-ws',
        role: 'EDITOR',
      });
      await expect(
        service.updateMemberRole('ws1', 'm1', 'ADMIN'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses to change the owner’s role', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'm1',
        workspaceId: 'ws1',
        role: 'OWNER',
      });
      await expect(
        service.updateMemberRole('ws1', 'm1', 'ADMIN'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.workspaceMember.update).not.toHaveBeenCalled();
    });

    it('updates a non-owner member', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'm1',
        workspaceId: 'ws1',
        role: 'VIEWER',
      });
      prisma.workspaceMember.update.mockResolvedValue({
        id: 'm1',
        role: 'ADMIN',
      });
      await service.updateMemberRole('ws1', 'm1', 'ADMIN');
      expect(prisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { role: 'ADMIN' },
      });
    });
  });

  describe('removeMember', () => {
    it('refuses to remove the owner', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'm1',
        workspaceId: 'ws1',
        role: 'OWNER',
      });
      await expect(service.removeMember('ws1', 'm1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.workspaceMember.delete).not.toHaveBeenCalled();
    });

    it('removes a non-owner member', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'm1',
        workspaceId: 'ws1',
        role: 'EDITOR',
      });
      prisma.workspaceMember.delete.mockResolvedValue({ id: 'm1' });
      await expect(service.removeMember('ws1', 'm1')).resolves.toEqual({
        id: 'm1',
      });
    });
  });

  describe('listMembers', () => {
    it('requires the caller to be a member of the workspace', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.listMembers('ws1', 'intruder')).rejects.toThrow();
    });
  });
});
