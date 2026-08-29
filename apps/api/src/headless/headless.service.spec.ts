import { NotFoundException } from '@nestjs/common';
import { HeadlessService } from './headless.service';
import type { PrismaService } from '../prisma/prisma.service';

/** Read-only headless queries — published-only, scoped to the key's website. */
describe('HeadlessService', () => {
  let prisma: {
    collection: { findFirst: jest.Mock };
    collectionEntry: { findMany: jest.Mock; findFirst: jest.Mock };
    page: { findMany: jest.Mock; findFirst: jest.Mock };
  };
  let service: HeadlessService;

  beforeEach(() => {
    prisma = {
      collection: { findFirst: jest.fn() },
      collectionEntry: { findMany: jest.fn(), findFirst: jest.fn() },
      page: { findMany: jest.fn(), findFirst: jest.fn() },
    };
    service = new HeadlessService(prisma as unknown as PrismaService);
  });

  it('404s when the collection is not in this website', async () => {
    prisma.collection.findFirst.mockResolvedValue(null);
    await expect(
      service.entries('w1', 'blog-posts', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: { websiteId: 'w1', slug: 'blog-posts' },
    });
  });

  it('returns only PUBLISHED entries and a forward cursor', async () => {
    prisma.collection.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.collectionEntry.findMany.mockResolvedValue(
      Array.from({ length: 26 }, (_, i) => ({
        id: `e${i}`,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    const res = await service.entries('w1', 'blog-posts', { limit: 25 });
    expect(prisma.collectionEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { collectionId: 'c1', status: 'PUBLISHED' },
      }),
    );
    expect(res.entries).toHaveLength(25);
    expect(res.nextCursor).toBe('e24');
  });

  it('resolves a page only when published', async () => {
    prisma.page.findFirst.mockResolvedValue(null);
    await expect(service.page('w1', '/about')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.page.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { websiteId: 'w1', slug: '/about', status: 'PUBLISHED' },
      }),
    );
  });
});
