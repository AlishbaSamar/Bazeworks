import { BadRequestException } from '@nestjs/common';
import { PublishingService } from './publishing.service';

describe('PublishingService', () => {
  let prisma: any;
  let service: PublishingService;

  const website = {
    id: 'w1',
    workspaceId: 'ws1',
    name: 'Site',
    slug: 'site',
    theme: { colors: {} },
    globalHeader: { logoText: 'X' },
    globalFooter: {},
    seo: { robots: 'index,follow' },
    logoUrl: null,
    faviconUrl: null,
    lastPublishedAt: null,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      workspaceMember: {
        findUnique: jest.fn().mockResolvedValue({ role: 'EDITOR' }),
      },
      website: {
        findUnique: jest.fn().mockResolvedValue(website),
        update: jest.fn().mockResolvedValue({}),
      },
      page: { findMany: jest.fn() },
      collection: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
      },
      collectionField: { findFirst: jest.fn().mockResolvedValue(null) },
      collectionEntry: { count: jest.fn().mockResolvedValue(0) },
      publication: {
        create: jest.fn((args: any) =>
          Promise.resolve({ id: 'pub1', createdAt: new Date(), ...args.data }),
        ),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    service = new PublishingService(prisma);
  });

  it('flags a website with no published pages', async () => {
    prisma.page.findMany.mockResolvedValue([
      { id: 'p1', name: 'Home', slug: '/', status: 'DRAFT', isDynamic: false },
    ]);
    const { errors } = await service.dryRun('ws1', 'w1', 'u1');
    expect(errors.join(' ')).toMatch(/No pages are published/);
  });

  it('flags a dynamic page whose slug field no longer exists', async () => {
    prisma.page.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Home',
        slug: '/',
        status: 'PUBLISHED',
        isDynamic: false,
      },
      {
        id: 'p2',
        name: 'Blog',
        slug: '/blog',
        status: 'PUBLISHED',
        isDynamic: true,
        dynamicCollectionId: 'c1',
        dynamicSlugField: 'slug',
        dynamicCollection: { name: 'Posts', fields: [{ key: 'title' }] },
      },
    ]);
    const { errors } = await service.dryRun('ws1', 'w1', 'u1');
    expect(errors.join(' ')).toMatch(/slug field that no longer exists/);
  });

  it('refuses to publish while validation errors exist', async () => {
    prisma.page.findMany.mockResolvedValue([
      { id: 'p1', name: 'Home', slug: '/', status: 'DRAFT', isDynamic: false },
    ]);
    await expect(service.publish('ws1', 'w1', 'u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.publication.create).not.toHaveBeenCalled();
  });

  it('snapshots pages, theme and collection schemas, then stamps lastPublishedAt', async () => {
    prisma.page.findMany
      // validate()
      .mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'Home',
          slug: '/',
          status: 'PUBLISHED',
          isDynamic: false,
        },
      ])
      // publish() snapshot read
      .mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'Home',
          slug: '/',
          status: 'PUBLISHED',
          order: 0,
          content: { content: [], root: {} },
          seo: {},
          isDynamic: false,
          dynamicCollection: null,
          dynamicSlugField: null,
        },
      ]);
    prisma.collection.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Posts',
        slug: 'posts',
        fields: [
          {
            name: 'Title',
            key: 'title',
            type: 'TEXT',
            required: true,
            options: [],
            relatedCollectionId: null,
          },
        ],
      },
    ]);

    const { publication } = await service.publish(
      'ws1',
      'w1',
      'u1',
      'first release',
    );

    const data = prisma.publication.create.mock.calls[0][0].data;
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0]).toMatchObject({ slug: '/', status: 'PUBLISHED' });
    expect(data.theme).toEqual(website.theme);
    expect(data.collectionSchemas[0]).toMatchObject({ slug: 'posts' });
    expect(prisma.website.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'LIVE' }),
      }),
    );
    expect(publication.id).toBe('pub1');
  });
});
