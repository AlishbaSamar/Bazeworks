import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from './common/mailer/mailer.module';
import { auth } from './auth/better-auth.config';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { WebsitesModule } from './websites/websites.module';
import { TemplatesModule } from './templates/templates.module';
import { PagesModule } from './pages/pages.module';
import { CollectionsModule } from './collections/collections.module';
import { MediaModule } from './media/media.module';
import { SitemapModule } from './sitemap/sitemap.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { HeadlessModule } from './headless/headless.module';
import { PublishingModule } from './publishing/publishing.module';
import { PreviewModule } from './preview/preview.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { RenderModule } from './render/render.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    MailerModule,
    AuthModule.forRoot({ auth }),
    WorkspacesModule,
    WebsitesModule,
    TemplatesModule,
    PagesModule,
    CollectionsModule,
    MediaModule,
    SitemapModule,
    ApiKeysModule,
    HeadlessModule,
    PublishingModule,
    PreviewModule,
    DeploymentsModule,
    RenderModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
