import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PagesService } from './pages.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('PagesService.resolveDynamicPage', () => {
  let prisma: {
    workspaceMember: { findUnique: jest.Mock };
    website: { findUnique: jest.Mock };
    page: { findUnique: jest.Mock };
    collectionEntry: { findFirst: jest.Mock };
  };
  let service: PagesService;

  beforeEach(() => {
    prisma = {
      workspaceMember: {
        findUnique: jest.fn().mockResolvedValue({ id: 'm1' }),
      },
      website: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'w1', workspaceId: 'ws1' }),
      },
      page: { findUnique: jest.fn() },
      collectionEntry: { findFirst: jest.fn() },
    };
    service = new PagesService(prisma as unknown as PrismaService);
  });

  it('resolves /blog/hello-world to the dynamic page and its published entry', async () => {
    prisma.page.findUnique.mockResolvedValue({
      id: 'p1',
      slug: '/blog',
      isDynamic: true,
      dynamicCollectionId: 'c1',
      dynamicSlugField: 'slug',
    });
    const entry = {
      id: 'e1',
      status: 'PUBLISHED',
      data: { slug: 'hello-world' },
    };
    prisma.collectionEntry.findFirst.mockResolvedValue(entry);

    const result = await service.resolveDynamicPage(
      'ws1',
      'w1',
      'u1',
      '/blog/hello-world',
    );

    expect(prisma.page.findUnique).toHaveBeenCalledWith({
      where: { websiteId_slug: { websiteId: 'w1', slug: '/blog' } },
    });
    expect(prisma.collectionEntry.findFirst).toHaveBeenCalledWith({
      where: {
        collectionId: 'c1',
        status: 'PUBLISHED',
        data: { path: ['slug'], equals: 'hello-world' },
      },
    });
    expect(result).toEqual({
      page: expect.objectContaining({ id: 'p1' }),
      entry,
    });
  });

  it('404s when the parent page is not marked dynamic', async () => {
    prisma.page.findUnique.mockResolvedValue({
      id: 'p1',
      slug: '/blog',
      isDynamic: false,
      dynamicCollectionId: null,
      dynamicSlugField: null,
    });
    await expect(
      service.resolveDynamicPage('ws1', 'w1', 'u1', '/blog/hello'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s when no published entry matches the slug', async () => {
    prisma.page.findUnique.mockResolvedValue({
      id: 'p1',
      slug: '/blog',
      isDynamic: true,
      dynamicCollectionId: 'c1',
      dynamicSlugField: 'slug',
    });
    prisma.collectionEntry.findFirst.mockResolvedValue(null);
    await expect(
      service.resolveDynamicPage('ws1', 'w1', 'u1', '/blog/missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses a caller who is not a member of the workspace', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue(null);
    await expect(
      service.resolveDynamicPage('ws1', 'w1', 'outsider', '/blog/hello'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
