import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port, '127.0.0.1');
}

void bootstrap();
