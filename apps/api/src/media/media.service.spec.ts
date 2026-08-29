import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { CloudinaryService } from './cloudinary.service';

/** Upload validation + alt-text update (PRD §8.10, §9.4). */
describe('MediaService', () => {
  let prisma: {
    workspaceMember: { findUnique: jest.Mock };
    website: { findUnique: jest.Mock };
    asset: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let cloudinary: {
    configured: boolean;
    destroy: jest.Mock;
    signUpload: jest.Mock;
  };
  let service: MediaService;

  beforeEach(() => {
    prisma = {
      workspaceMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'EDITOR' }),
      },
      website: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'w1', workspaceId: 'ws1' }),
      },
      asset: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn((args) => Promise.resolve({ id: 'a1', ...args.data })),
        update: jest.fn((args) => Promise.resolve({ id: 'a1', ...args.data })),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    cloudinary = {
      configured: true,
      destroy: jest.fn(),
      signUpload: jest.fn(),
    };
    service = new MediaService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryService,
    );
  });

  const base = {
    externalId: 'bazeworks/w1/x',
    url: 'https://res.cloudinary.com/x/image/upload/x.png',
    filename: 'x.png',
    bytes: 1024,
  };

  it('rejects an unsupported mime type', async () => {
    await expect(
      service.create('ws1', 'w1', 'u1', {
        ...base,
        mimeType: 'application/zip',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an image over the size limit', async () => {
    await expect(
      service.create('ws1', 'w1', 'u1', {
        ...base,
        mimeType: 'image/png',
        bytes: 20 * 1024 * 1024,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('derives kind IMAGE from the mime type', async () => {
    const asset = await service.create('ws1', 'w1', 'u1', {
      ...base,
      mimeType: 'image/png',
    });
    expect(asset.kind).toBe('IMAGE');
  });

  it('trims alt text on update', async () => {
    prisma.asset.findUnique.mockResolvedValue({ id: 'a1', websiteId: 'w1' });
    const updated = await service.updateAlt('ws1', 'w1', 'a1', '  a logo  ');
    expect(updated.alt).toBe('a logo');
  });

  it('removes the record and asks Cloudinary to delete the file', async () => {
    prisma.asset.findUnique.mockResolvedValue({
      id: 'a1',
      websiteId: 'w1',
      kind: 'IMAGE',
      externalId: 'bazeworks/w1/x',
    });
    await service.remove('ws1', 'w1', 'a1');
    expect(prisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
    expect(cloudinary.destroy).toHaveBeenCalledWith('bazeworks/w1/x', 'image');
  });
});
