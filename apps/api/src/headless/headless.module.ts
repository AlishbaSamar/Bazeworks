import { Module } from '@nestjs/common';
import { HeadlessController } from './headless.controller';
import { HeadlessService } from './headless.service';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  controllers: [HeadlessController],
  providers: [HeadlessService, ApiKeyGuard],
})
export class HeadlessModule {}
