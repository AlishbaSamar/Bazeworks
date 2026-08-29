import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { RenderService } from './render.service';

/** Public — this is the live site's data source, consumed by apps/site. */
@Public()
@Controller('public/render/:websiteId')
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Get('site')
  site(@Param('websiteId') websiteId: string) {
    return this.renderService.site(websiteId);
  }

  @Get('resolve')
  resolve(@Param('websiteId') websiteId: string, @Query('path') path?: string) {
    return this.renderService.resolve(websiteId, path ?? '/');
  }
}
