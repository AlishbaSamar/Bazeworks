import { WebsitesService } from './websites.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { TemplatesService } from '../templates/templates.service';

/**
 * Deep template copy (PRD §8.4): a website created from a template must get
 * the template's pages *with content*, collections, field definitions and
 * sample entries — with every cross-reference (RELATION fields, relation
 * entry values, dynamic-page bindings, dynamic-component `source` props)
 * rewired from template slugs/handles to the new website's real ids.
 */
describe('WebsitesService.create — from template', () => {
  let idSeq: number;

  function makeTx() {
    const collections: any[] = [];
    const fields: any[] = [];
    const entries: any[] = [];
    const pages: any[] = [];
    let website: any;

    return {
      store: {
        collections,
        fields,
        entries,
        pages,
        get website() {
          return website;
        },
      },
      tx: {
        website: {
          create: jest.fn(async ({ data }: any) => {
            website = { id: 'web1', ...data };
            return website;
          }),
          findUniqueOrThrow: jest.fn(async () => ({
            ...website,
            _count: { pages: pages.length },
          })),
        },
        collection: {
          create: jest.fn(async ({ data }: any) => {
            const row = { id: `col${++idSeq}`, ...data };
            collections.push(row);
            return row;
          }),
        },
        collectionField: {
          create: jest.fn(async ({ data }: any) => {
            const row = { id: `fld${++idSeq}`, ...data };
            fields.push(row);
            return row;
          }),
        },
        collectionEntry: {
          create: jest.fn(async ({ data }: any) => {
            const row = { id: `ent${++idSeq}`, ...data };
            entries.push(row);
            return row;
          }),
          findUniqueOrThrow: jest.fn(async ({ where }: any) =>
            entries.find((e) => e.id === where.id),
          ),
          update: jest.fn(async ({ where, data }: any) => {
            const row = entries.find((e) => e.id === where.id);
            Object.assign(row, data);
            return row;
          }),
        },
        page: {
          create: jest.fn(async ({ data }: any) => {
            const row = { id: `pg${++idSeq}`, ...data };
            pages.push(row);
            return row;
          }),
        },
      },
    };
  }

  function makeService(templateForCopy: any) {
    const { tx, store } = makeTx();
    const prisma = {
      $transaction: jest.fn(async (cb: any) => cb(tx)),
      website: { create: jest.fn(), findUniqueOrThrow: jest.fn() },
    };
    const templatesService = {
      getForCopy: jest.fn().mockResolvedValue(templateForCopy),
    };
    const service = new WebsitesService(
      prisma as unknown as PrismaService,
      templatesService as unknown as TemplatesService,
    );
    // generateUniqueSlug touches prisma.website.findUnique — stub it out.
    (prisma.website as any).findUnique = jest.fn().mockResolvedValue(null);
    return { service, store, tx };
  }

  beforeEach(() => {
    idSeq = 0;
  });

  const template = {
    id: 't1',
    name: 'Blog Minimal',
    theme: { colors: { primary: '#111' } },
    globalHeader: { logoText: 'X' },
    globalFooter: {},
    collections: [
      {
        name: 'Authors',
        slug: 'authors',
        order: 0,
        fields: [{ name: 'Name', key: 'name', type: 'TEXT', order: 0 }],
        entries: [
          { key: 'authors/0', status: 'PUBLISHED', data: { name: 'Dana' } },
        ],
      },
      {
        name: 'Blog Posts',
        slug: 'blog-posts',
        order: 1,
        fields: [
          { name: 'Title', key: 'title', type: 'TEXT', order: 0 },
          {
            name: 'Author',
            key: 'author',
            type: 'RELATION',
            order: 1,
            relatedCollectionSlug: 'authors',
          },
        ],
        entries: [
          {
            key: 'blog-posts/0',
            status: 'PUBLISHED',
            data: { title: 'Hello', author: { $entry: 'authors/0' } },
          },
        ],
      },
    ],
    pages: [
      {
        name: 'Home',
        slug: '/',
        order: 0,
        content: {
          content: [
            {
              type: 'CollectionList',
              props: { id: 'x', source: 'blog-posts' },
            },
          ],
          root: {},
        },
        isDynamic: false,
        dynamicCollectionSlug: null,
        dynamicSlugField: null,
      },
      {
        name: 'Blog',
        slug: '/blog',
        order: 1,
        content: { content: [], root: {} },
        isDynamic: true,
        dynamicCollectionSlug: 'blog-posts',
        dynamicSlugField: 'slug',
      },
    ],
  };

  it('creates collections, fields and entries and resolves every reference', async () => {
    const { service, store } = makeService(template);

    await service.create('ws1', 'u1', { name: 'My Blog', templateId: 't1' });

    // Two collections.
    expect(store.collections.map((c) => c.slug)).toEqual([
      'authors',
      'blog-posts',
    ]);

    // RELATION field points at the freshly-created "authors" collection id.
    const authorsCol = store.collections.find((c) => c.slug === 'authors');
    const relField = store.fields.find((f) => f.key === 'author');
    expect(relField.relatedCollectionId).toBe(authorsCol.id);

    // The blog post's relation value was rewritten from the "authors/0"
    // handle to the real author entry id in pass 2.
    const authorEntry = store.entries.find((e) => e.data?.name === 'Dana');
    const postEntry = store.entries.find((e) => e.data?.title === 'Hello');
    expect(postEntry.data.author).toBe(authorEntry.id);

    // Dynamic page bound to the real "blog-posts" collection id.
    const blogPostsCol = store.collections.find((c) => c.slug === 'blog-posts');
    const blogPage = store.pages.find((p) => p.slug === '/blog');
    expect(blogPage.isDynamic).toBe(true);
    expect(blogPage.dynamicCollectionId).toBe(blogPostsCol.id);
    expect(blogPage.dynamicSlugField).toBe('slug');

    // CollectionList `source` prop rewritten from slug to the real id.
    const homePage = store.pages.find((p) => p.slug === '/');
    expect(homePage.content.content[0].props.source).toBe(blogPostsCol.id);

    // Theme copied across.
    expect(store.website.theme).toEqual({ colors: { primary: '#111' } });
  });
});
