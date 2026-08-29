import { NotFoundException } from '@nestjs/common';
import { RenderService } from './render.service';

describe('RenderService', () => {
  let prisma: any;
  let service: RenderService;

  beforeEach(() => {
    prisma = {
      website: { findUnique: jest.fn() },
      publication: { findUnique: jest.fn() },
      collection: { findFirst: jest.fn() },
      collectionEntry: { findFirst: jest.fn() },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    service = new RenderService(prisma);
  });

  it('404s when the website has no live publication', async () => {
    prisma.website.findUnique.mockResolvedValue({
      id: 'w1',
      livePublicationId: null,
    });
    await expect(service.resolve('w1', '/')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  const livePub = {
    id: 'pub1',
    theme: {},
    globalHeader: {},
    globalFooter: {},
    websiteSeo: { name: 'Site', seo: {} },
    pages: [
      {
        name: 'Home',
        slug: '/',
        status: 'PUBLISHED',
        order: 0,
        content: {},
        seo: {},
        isDynamic: false,
      },
      {
        name: 'Draft',
        slug: '/secret',
        status: 'DRAFT',
        order: 1,
        content: {},
        seo: {},
        isDynamic: false,
      },
      {
        name: 'Blog',
        slug: '/blog',
        status: 'PUBLISHED',
        order: 2,
        content: {},
        seo: {},
        isDynamic: true,
        dynamicCollectionSlug: 'posts',
        dynamicSlugField: 'slug',
      },
    ],
  };

  beforeEach(() => {
    prisma.website.findUnique.mockResolvedValue({
      id: 'w1',
      livePublicationId: 'pub1',
      name: 'Site',
    });
    prisma.publication.findUnique.mockResolvedValue(livePub);
  });

  it('serves a published static page from the snapshot', async () => {
    const res = await service.resolve('w1', '/');
    expect(res.page.slug).toBe('/');
    expect(res.entry).toBeNull();
  });

  it('does not serve a page that is DRAFT in the snapshot', async () => {
    await expect(service.resolve('w1', '/secret')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('resolves a dynamic route to a live PUBLISHED entry', async () => {
    prisma.collection.findFirst.mockResolvedValue({ id: 'c1', fields: [] });
    prisma.collectionEntry.findFirst.mockResolvedValue({
      id: 'e1',
      collectionId: 'c1',
      data: { slug: 'hello' },
      status: 'PUBLISHED',
    });
    const res = await service.resolve('w1', '/blog/hello');
    expect(res.page.slug).toBe('/blog');
    expect(res.entry?.id).toBe('e1');
    expect(prisma.collectionEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
    );
  });

  it('404s a dynamic route with no matching published entry', async () => {
    prisma.collection.findFirst.mockResolvedValue({ id: 'c1', fields: [] });
    prisma.collectionEntry.findFirst.mockResolvedValue(null);
    await expect(service.resolve('w1', '/blog/missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
