import { randomUUID } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { defaultContentForPageType } from '../src/pages/page-templates';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Puck component helper — mirrors the { type, props: { id, ... } } shape the
// editor produces (same convention as src/pages/page-templates.ts).
// ---------------------------------------------------------------------------
function c(type: string, props: Record<string, unknown>) {
  return {
    type,
    props: { id: `${type.toLowerCase()}-${randomUUID()}`, ...props },
  };
}

function page(components: Record<string, unknown>[]) {
  return { content: components, root: {} };
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------
const SAAS_THEME = {
  colors: {
    primary: '#4F46E5',
    secondary: '#0EA5E9',
    background: '#FFFFFF',
    text: '#0F172A',
    accent: '#F59E0B',
    border: '#E2E8F0',
  },
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    baseFontSize: 16,
    headingWeight: '700',
    bodyWeight: '400',
  },
  layout: { containerWidth: 1200, borderRadius: 10, spacingScale: 'comfortable' },
};

const BLOG_THEME = {
  colors: {
    primary: '#111827',
    secondary: '#6B7280',
    background: '#FFFFFF',
    text: '#1F2937',
    accent: '#B91C1C',
    border: '#E5E7EB',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Merriweather',
    baseFontSize: 18,
    headingWeight: '700',
    bodyWeight: '400',
  },
  layout: { containerWidth: 820, borderRadius: 4, spacingScale: 'spacious' },
};

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------
interface SeedTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  theme: object;
  globalHeader: object;
  globalFooter: object;
  pages: {
    name: string;
    slug: string;
    order: number;
    content: object;
    isDynamic?: boolean;
    dynamicCollectionSlug?: string;
    dynamicSlugField?: string;
  }[];
  collections?: {
    name: string;
    slug: string;
    order: number;
    fields: object[];
    entries: object[];
  }[];
}

const SAAS_STARTER: SeedTemplate = {
  slug: 'saas-starter',
  name: 'SaaS Starter',
  description: 'Clean, modern SaaS landing site with features, pricing and FAQ.',
  category: 'SaaS',
  theme: SAAS_THEME,
  globalHeader: {
    logoText: 'Northwind',
    links: [
      { label: 'Features', url: '/features' },
      { label: 'Pricing', url: '/pricing' },
      { label: 'About', url: '/about' },
    ],
    ctaText: 'Start free trial',
    ctaUrl: '/pricing',
    showCta: true,
  },
  globalFooter: {
    logoText: 'Northwind',
    tagline: 'The workspace for teams that ship.',
    links: [
      { label: 'Privacy', url: '#' },
      { label: 'Terms', url: '#' },
      { label: 'Contact', url: '/about' },
    ],
    copyrightText: `© ${new Date().getFullYear()} Northwind, Inc.`,
  },
  pages: [
    { name: 'Home', slug: '/', order: 0, content: defaultContentForPageType('home') },
    {
      name: 'Features',
      slug: '/features',
      order: 1,
      content: defaultContentForPageType('services'),
    },
    {
      name: 'Pricing',
      slug: '/pricing',
      order: 2,
      content: defaultContentForPageType('pricing'),
    },
    {
      name: 'About',
      slug: '/about',
      order: 3,
      content: defaultContentForPageType('about'),
    },
  ],
};

const BLOG_MINIMAL: SeedTemplate = {
  slug: 'blog-minimal',
  name: 'Blog Minimal',
  description:
    'Minimal editorial blog with a Posts collection and a working /blog/[slug] dynamic route.',
  category: 'Blog',
  theme: BLOG_THEME,
  globalHeader: {
    logoText: 'The Margin',
    links: [
      { label: 'Home', url: '/' },
      { label: 'Blog', url: '/blog' },
    ],
    ctaText: 'Subscribe',
    ctaUrl: '#',
    showCta: false,
  },
  globalFooter: {
    logoText: 'The Margin',
    tagline: 'Notes on craft, code and the spaces between.',
    links: [
      { label: 'RSS', url: '#' },
      { label: 'About', url: '/' },
    ],
    copyrightText: `© ${new Date().getFullYear()} The Margin.`,
  },
  collections: [
    {
      name: 'Authors',
      slug: 'authors',
      order: 0,
      fields: [
        { name: 'Name', key: 'name', type: 'TEXT', required: true, order: 0 },
        { name: 'Bio', key: 'bio', type: 'TEXTAREA', order: 1 },
        { name: 'Avatar', key: 'avatar', type: 'IMAGE', order: 2 },
      ],
      entries: [
        {
          key: 'authors/0',
          status: 'PUBLISHED',
          data: {
            name: 'Dana Whitfield',
            bio: 'Writes about design systems and the discipline of shipping.',
          },
        },
      ],
    },
    {
      name: 'Blog Posts',
      slug: 'blog-posts',
      order: 1,
      fields: [
        { name: 'Title', key: 'title', type: 'TEXT', required: true, order: 0 },
        { name: 'Slug', key: 'slug', type: 'TEXT', required: true, order: 1 },
        { name: 'Cover image', key: 'coverImage', type: 'IMAGE', order: 2 },
        { name: 'Excerpt', key: 'excerpt', type: 'TEXTAREA', order: 3 },
        { name: 'Body', key: 'body', type: 'RICH_TEXT', order: 4 },
        {
          name: 'Author',
          key: 'author',
          type: 'RELATION',
          order: 5,
          relatedCollectionSlug: 'authors',
        },
        { name: 'Published date', key: 'publishedDate', type: 'DATE', order: 6 },
      ],
      entries: [
        {
          key: 'blog-posts/0',
          status: 'PUBLISHED',
          data: {
            title: 'Designing for the first five minutes',
            slug: 'first-five-minutes',
            excerpt:
              'The onboarding window is short. Here is how we think about earning the next click.',
            body: 'The first five minutes of a product decide everything...\n\nStart with one obvious next action and remove the rest.',
            author: { $entry: 'authors/0' },
            publishedDate: '2026-02-10',
          },
        },
        {
          key: 'blog-posts/1',
          status: 'PUBLISHED',
          data: {
            title: 'A small case for boring technology',
            slug: 'boring-technology',
            excerpt:
              'Novelty has a carrying cost. Boring tools leave you budget for the interesting problems.',
            body: 'Every new dependency is a small loan against future attention...\n\nSpend the novelty budget where it differentiates the product.',
            author: { $entry: 'authors/0' },
            publishedDate: '2026-03-01',
          },
        },
        {
          key: 'blog-posts/2',
          status: 'PUBLISHED',
          data: {
            title: 'Notes on writing changelogs people read',
            slug: 'readable-changelogs',
            excerpt:
              'A changelog is a product surface. Treat it like one.',
            body: 'Lead with the user-visible change, not the internal refactor...\n\nOne sentence of why beats a paragraph of what.',
            author: { $entry: 'authors/0' },
            publishedDate: '2026-03-18',
          },
        },
      ],
    },
  ],
  pages: [
    {
      name: 'Home',
      slug: '/',
      order: 0,
      content: page([
        c('Hero', {
          eyebrow: '',
          heading: 'The Margin',
          subheading: 'Notes on craft, code and the spaces between.',
          primaryCtaText: 'Read the blog',
          primaryCtaUrl: '/blog',
          secondaryCtaText: '',
          secondaryCtaUrl: '',
          showSecondaryCta: false,
          align: 'center',
        }),
        c('CollectionList', {
          source: 'blog-posts',
          heading: 'Latest posts',
          limit: 6,
          order: 'desc',
          publishedOnly: true,
        }),
      ]),
    },
    {
      name: 'Blog',
      slug: '/blog',
      order: 1,
      isDynamic: true,
      dynamicCollectionSlug: 'blog-posts',
      dynamicSlugField: 'slug',
      content: page([
        c('CollectionItem', {
          entry: { collectionId: 'blog-posts', entryId: '' },
        }),
        c('RelatedPosts', {
          source: 'blog-posts',
          heading: 'More posts',
          limit: 3,
          excludeEntry: { collectionId: 'blog-posts', entryId: '' },
        }),
      ]),
    },
  ],
};

const TEMPLATES: SeedTemplate[] = [SAAS_STARTER, BLOG_MINIMAL];

// ---------------------------------------------------------------------------
async function main() {
  for (const t of TEMPLATES) {
    // Replace the whole template on each run so seed stays the source of
    // truth (children cascade-delete).
    await prisma.template.deleteMany({ where: { slug: t.slug } });
    await prisma.template.create({
      data: {
        slug: t.slug,
        name: t.name,
        description: t.description,
        category: t.category,
        kind: 'SITE',
        isOfficial: true,
        theme: t.theme as Prisma.InputJsonValue,
        globalHeader: t.globalHeader as Prisma.InputJsonValue,
        globalFooter: t.globalFooter as Prisma.InputJsonValue,
        pages: {
          create: t.pages.map((p) => ({
            name: p.name,
            slug: p.slug,
            order: p.order,
            content: p.content as Prisma.InputJsonValue,
            isDynamic: p.isDynamic ?? false,
            dynamicCollectionSlug: p.dynamicCollectionSlug ?? null,
            dynamicSlugField: p.dynamicSlugField ?? null,
          })),
        },
        collections: {
          create: (t.collections ?? []).map((col) => ({
            name: col.name,
            slug: col.slug,
            order: col.order,
            fields: col.fields as Prisma.InputJsonValue,
            entries: col.entries as Prisma.InputJsonValue,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${TEMPLATES.length} official templates.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
