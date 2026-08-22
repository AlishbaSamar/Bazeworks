import { setDefaultResultOrder } from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Some networks (including this project's dev machines) have no working
// IPv6 route, but Neon's hostname resolves to both A and AAAA records.
// Without this, Node can pick an unreachable IPv6 address and every
// Prisma query fails with "Can't reach database server" until it
// happens to resolve IPv4 again.
setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: config.get<string>('WEB_APP_URL'),
    credentials: true,
  });

  const port = config.get<string>('PORT', '4000');
  await app.listen(port);
}
void bootstrap();
