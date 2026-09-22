import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  /* Global prefix */
  app.setGlobalPrefix('api');

  /* API versioning */
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  /* CORS — locked to CORS_ORIGIN env var; never defaults to * in production */
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '');
  app.enableCors({
    origin: corsOrigin === '*' || !corsOrigin ? corsOrigin || true : corsOrigin.split(',').map(s => s.trim()),
    credentials: true,
  });

  /* Global validation pipe */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:              true,
      forbidNonWhitelisted:   true,
      transform:              true,
      transformOptions:       { enableImplicitConversion: true },
    }),
  );

  /* ── Global rate-limiting guard ──
     Enforces ThrottlerModule tiers defined in AppModule.
     The /health endpoint is excluded via @SkipThrottle() on its controller.
  ── */
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new ThrottlerGuard({}, undefined as any, reflector));

  /* Swagger API docs — dev only */
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DG-LETS Agri Market API')
      .setDescription('Backend API for DG-LETS Agri Market Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);
  console.log(`\n🌾 DG-LETS Agri Market API running on: http://localhost:${port}/api`);
  if (configService.get<string>('NODE_ENV') !== 'production') {
    console.log(`📖 API Docs: http://localhost:${port}/api/docs\n`);
  }
}

bootstrap();
