import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEMPLATES = [
  {
    slug: 'saas-starter',
    name: 'SaaS Starter',
    description: 'Clean and modern SaaS landing with pricing.',
    category: 'SaaS',
    pages: [
      { name: 'Home', slug: '/' },
      { name: 'Features', slug: '/features' },
      { name: 'Pricing', slug: '/pricing' },
      { name: 'About', slug: '/about' },
    ],
  },
  {
    slug: 'blog-minimal',
    name: 'Blog Minimal',
    description: 'Minimal blog template for writers.',
    category: 'Blog',
    pages: [
      { name: 'Home', slug: '/' },
      { name: 'Blog', slug: '/blog' },
    ],
  },
];

async function main() {
  for (const template of TEMPLATES) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
      },
      create: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        category: template.category,
        pages: { create: template.pages },
      },
    });

    // Keep the page set in sync on re-seed without duplicating rows.
    const existing = await prisma.template.findUniqueOrThrow({
      where: { slug: template.slug },
      include: { pages: true },
    });
    const desiredSlugs = new Set(template.pages.map((p) => p.slug));
    const existingSlugs = new Set(existing.pages.map((p) => p.slug));

    const toDelete = existing.pages.filter((p) => !desiredSlugs.has(p.slug));
    if (toDelete.length > 0) {
      await prisma.templatePage.deleteMany({
        where: { id: { in: toDelete.map((p) => p.id) } },
      });
    }

    const toCreate = template.pages.filter((p) => !existingSlugs.has(p.slug));
    if (toCreate.length > 0) {
      await prisma.templatePage.createMany({
        data: toCreate.map((p) => ({ ...p, templateId: existing.id })),
      });
    }
  }

  console.log(`Seeded ${TEMPLATES.length} templates.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
