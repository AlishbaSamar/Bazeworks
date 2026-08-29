import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Injectable()
export class SitemapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private async requireWebsite(websiteId: string) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });
    if (!website) throw new NotFoundException('Website not found');
    return website;
  }

  /** Absolute origin for this website's rendered pages. Day 12 fills
   * productionUrl with the real Vercel URL; until then SITE_BASE_URL. */
  private baseUrl(productionUrl: string | null): string {
    const base =
      productionUrl ||
      this.config.get<string>('SITE_BASE_URL') ||
      'https://your-site.example';
    return base.replace(/\/+$/, '');
  }

  private join(base: string, path: string): string {
    if (path === '/' || path === '') return base + '/';
    return base + (path.startsWith('/') ? path : `/${path}`);
  }

  async buildSitemap(websiteId: string): Promise<string> {
    const website = await this.requireWebsite(websiteId);
    const base = this.baseUrl(website.productionUrl);

    const pages = await this.prisma.page.findMany({
      where: { websiteId, status: 'PUBLISHED' },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    const urls: { loc: string; lastmod: Date }[] = [];

    for (const page of pages) {
      if (page.isDynamic && page.dynamicCollectionId && page.dynamicSlugField) {
        // A dynamic page has no standalone URL of its own — emit one entry
        // per published collection entry instead.
        const entries = await this.prisma.collectionEntry.findMany({
          where: {
            collectionId: page.dynamicCollectionId,
            status: 'PUBLISHED',
          },
        });
        for (const entry of entries) {
          const slugValue = (entry.data as Record<string, unknown>)[
            page.dynamicSlugField
          ];
          if (typeof slugValue !== 'string' || !slugValue) continue;
          urls.push({
            loc: this.join(
              base,
              `${page.slug}/${slugValue}`.replace('//', '/'),
            ),
            lastmod: entry.updatedAt,
          });
        }
      } else {
        urls.push({ loc: this.join(base, page.slug), lastmod: page.updatedAt });
      }
    }

    const body = urls
      .map(
        (u) =>
          `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${u.lastmod
            .toISOString()
            .slice(0, 10)}</lastmod>\n  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  }

  async buildRobots(websiteId: string): Promise<string> {
    const website = await this.requireWebsite(websiteId);
    const base = this.baseUrl(website.productionUrl);
    const seo = (website.seo as Record<string, unknown>) ?? {};
    const indexable = seo.indexable !== false;

    if (!indexable) {
      return `User-agent: *\nDisallow: /\n`;
    }
    return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
  }
}
