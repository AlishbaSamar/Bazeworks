import { BadRequestException } from '@nestjs/common';
import { DeploymentsService, mapState } from './deployments.service';
import type { VercelService } from './vercel.service';

describe('mapState (Vercel readyState → our lifecycle)', () => {
  it('maps every Vercel state', () => {
    expect(mapState('QUEUED')).toBe('QUEUED');
    expect(mapState('INITIALIZING')).toBe('BUILDING');
    expect(mapState('BUILDING')).toBe('BUILDING');
    expect(mapState('READY')).toBe('READY');
    expect(mapState('CANCELED')).toBe('CANCELLED');
    expect(mapState('ERROR')).toBe('FAILED');
  });
});

describe('DeploymentsService.deploy', () => {
  let prisma: any;
  let vercel: {
    configured: boolean;
    triggerDeployHook: jest.Mock;
    latestDeployment: jest.Mock;
  };
  let service: DeploymentsService;

  beforeEach(() => {
    prisma = {
      workspaceMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
      },
      website: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'w1', workspaceId: 'ws1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      publication: { findFirst: jest.fn() },
      deployment: {
        create: jest.fn((a: any) =>
          Promise.resolve({ id: 'd1', createdAt: new Date(), ...a.data }),
        ),
        update: jest.fn((a: any) => Promise.resolve({ id: 'd1', ...a.data })),
      },
    };
    vercel = {
      configured: true,
      triggerDeployHook: jest.fn().mockResolvedValue(undefined),
      latestDeployment: jest.fn().mockResolvedValue({
        id: 'vd1',
        url: 'site-x.vercel.app',
        readyState: 'BUILDING',
        createdAt: Date.now(),
      }),
    };
    service = new DeploymentsService(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      prisma,
      vercel as unknown as VercelService,
    );
  });

  it('refuses to deploy a website that has never been published', async () => {
    prisma.publication.findFirst.mockResolvedValue(null);
    await expect(service.deploy('ws1', 'w1', 'u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.deployment.create).not.toHaveBeenCalled();
  });

  it('points livePublicationId at the snapshot and triggers Vercel', async () => {
    prisma.publication.findFirst.mockResolvedValue({
      id: 'pub1',
      websiteId: 'w1',
    });
    const result = await service.deploy('ws1', 'w1', 'u1');

    expect(prisma.website.update).toHaveBeenCalledWith({
      where: { id: 'w1' },
      data: { livePublicationId: 'pub1' },
    });
    expect(vercel.triggerDeployHook).toHaveBeenCalled();
    expect(result.vercelDeploymentId).toBe('vd1');
    expect(result.status).toBe('BUILDING');
  });

  it('deploys a specific publication (the rollback path)', async () => {
    prisma.publication.findFirst.mockImplementation((args: any) =>
      Promise.resolve({ id: args.where.id ?? 'latest', websiteId: 'w1' }),
    );
    await service.deploy('ws1', 'w1', 'u1', 'old-pub');
    expect(prisma.website.update).toHaveBeenCalledWith({
      where: { id: 'w1' },
      data: { livePublicationId: 'old-pub' },
    });
  });

  it('marks the deployment FAILED when Vercel is not configured', async () => {
    vercel.configured = false;
    prisma.publication.findFirst.mockResolvedValue({
      id: 'pub1',
      websiteId: 'w1',
    });
    const result = await service.deploy('ws1', 'w1', 'u1');
    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toMatch(/not configured/i);
  });
});
