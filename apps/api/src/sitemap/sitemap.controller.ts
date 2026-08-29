import { Controller, Get, Header, Param } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { SitemapService } from './sitemap.service';

/**
 * Public, unauthenticated. Each website exposes its own sitemap/robots so
 * search engines (and Day 12's deployment) can point at a stable URL.
 */
@Public()
@Controller('public/sites/:websiteId')
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  sitemap(@Param('websiteId') websiteId: string) {
    return this.sitemapService.buildSitemap(websiteId);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  robots(@Param('websiteId') websiteId: string) {
    return this.sitemapService.buildRobots(websiteId);
  }
}
