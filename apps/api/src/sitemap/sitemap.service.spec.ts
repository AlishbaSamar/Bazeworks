import { NotFoundException } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ConfigService } from '@nestjs/config';

describe('SitemapService', () => {
  let prisma: {
    website: { findUnique: jest.Mock };
    page: { findMany: jest.Mock };
    collectionEntry: { findMany: jest.Mock };
  };
  let config: { get: jest.Mock };
  let service: SitemapService;

  beforeEach(() => {
    prisma = {
      website: { findUnique: jest.fn() },
      page: { findMany: jest.fn() },
      collectionEntry: { findMany: jest.fn() },
    };
    config = { get: jest.fn().mockReturnValue('https://example.com') };
    service = new SitemapService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  it('404s for an unknown website', async () => {
    prisma.website.findUnique.mockResolvedValue(null);
    await expect(service.buildSitemap('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists published static pages and one URL per published dynamic entry', async () => {
    prisma.website.findUnique.mockResolvedValue({
      productionUrl: null,
      seo: {},
    });
    prisma.page.findMany.mockResolvedValue([
      { slug: '/', isDynamic: false, updatedAt: new Date('2026-01-01') },
      {
        slug: '/blog',
        isDynamic: true,
        dynamicCollectionId: 'c1',
        dynamicSlugField: 'slug',
        updatedAt: new Date('2026-01-01'),
      },
    ]);
    prisma.collectionEntry.findMany.mockResolvedValue([
      { data: { slug: 'hello' }, updatedAt: new Date('2026-02-01') },
      { data: { slug: 'world' }, updatedAt: new Date('2026-02-02') },
    ]);

    const xml = await service.buildSitemap('w1');
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/blog/hello</loc>');
    expect(xml).toContain('<loc>https://example.com/blog/world</loc>');
    // The dynamic parent page itself is not a crawlable URL.
    expect(xml).not.toContain('<loc>https://example.com/blog</loc>');
  });

  it('disallows everything when the site is not indexable', async () => {
    prisma.website.findUnique.mockResolvedValue({
      productionUrl: null,
      seo: { indexable: false },
    });
    const robots = await service.buildRobots('w1');
    expect(robots).toContain('Disallow: /');
    expect(robots).not.toContain('Allow: /');
  });
});
