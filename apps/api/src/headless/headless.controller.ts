import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { ApiKeyGuard, type HeadlessRequest } from './api-key.guard';
import { HeadlessService } from './headless.service';

/**
 * Public headless CMS API (PRD §8.14). Every route is scoped to the website
 * the presented API key belongs to — `@Public()` disables the session guard,
 * `ApiKeyGuard` does the auth and sets req.apiWebsiteId.
 */
@Public()
@UseGuards(ApiKeyGuard)
@Controller('v1')
export class HeadlessController {
  constructor(private readonly headless: HeadlessService) {}

  private websiteId(req: HeadlessRequest): string {
    // ApiKeyGuard guarantees this is set before the handler runs.
    return req.apiWebsiteId as string;
  }

  @Get('site')
  site(@Req() req: HeadlessRequest) {
    return this.headless.site(this.websiteId(req));
  }

  @Get('pages')
  pages(@Req() req: HeadlessRequest) {
    return this.headless.pages(this.websiteId(req));
  }

  @Get('page')
  page(@Req() req: HeadlessRequest, @Query('path') path: string) {
    return this.headless.page(this.websiteId(req), path ?? '/');
  }

  @Get('collections')
  collections(@Req() req: HeadlessRequest) {
    return this.headless.collections(this.websiteId(req));
  }

  @Get('collections/:slug/entries')
  entries(
    @Req() req: HeadlessRequest,
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.headless.entries(this.websiteId(req), slug, {
      limit: limit ? Number(limit) : undefined,
      cursor,
      order,
    });
  }

  @Get('collections/:slug/entries/:entryId')
  entry(
    @Req() req: HeadlessRequest,
    @Param('slug') slug: string,
    @Param('entryId') entryId: string,
  ) {
    return this.headless.entry(this.websiteId(req), slug, entryId);
  }
}
