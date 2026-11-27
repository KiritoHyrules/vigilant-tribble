import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpErrorFilter } from './common/errors/http-error.filter';
import { parseCorsOrigins } from './config/cors';
import type { EnvironmentVariables } from './config/env.validation';

/** Configuración HTTP compartida por el arranque y las pruebas e2e. */
export function setupApp(app: INestApplication): void {
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());
  app.enableShutdownHooks();

  const origins = parseCorsOrigins(config.get('CORS_ORIGINS', { infer: true }));
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: true });
  }

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const document = new DocumentBuilder()
      .setTitle('TRASU API')
      .setVersion('0.1.0')
      .build();
    SwaggerModule.setup('api/docs', app, () =>
      SwaggerModule.createDocument(app, document),
    );
  }
}
