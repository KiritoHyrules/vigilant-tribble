import { Body, Controller, Get, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { AccessPolicy } from '../src/common/security/access-policy';
import { Actor, CurrentActor } from '../src/common/security/current-actor';
import { Public } from '../src/common/security/public.decorator';

class ProbeDto {
  @IsString()
  name: string;
}

/** Solo existe en las pruebas. */
@Controller('probe')
class ProbeController {
  constructor(private readonly policy: AccessPolicy) {}

  @Get('protected')
  async protected(@Actor() actor: CurrentActor): Promise<void> {
    await this.policy.assertAllowed({
      actor,
      action: 'probe:read',
      resource: { type: 'probe' },
    });
  }

  @Public()
  @Post('validate')
  validate(@Body() body: ProbeDto): ProbeDto {
    return body;
  }

  @Public()
  @Get('crash')
  crash(): never {
    throw new Error('detalle interno');
  }
}

describe('API (e2e, PostgreSQL real)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    // Simula una sesión autenticada solo dentro de esta prueba.
    app.use(
      (
        req: { headers: Record<string, unknown>; actor?: CurrentActor },
        _res: unknown,
        next: () => void,
      ) => {
        if (req.headers['x-test-actor']) {
          req.actor = { id: 'test-actor', roles: [] };
        }
        next();
      },
    );
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health responde ok con la base disponible', () =>
    request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok', database: 'up' }));

  it('mantiene synchronize desactivado', () => {
    expect(app.get(DataSource).options.synchronize).toBe(false);
  });

  it('401 sin actor en un endpoint protegido', () =>
    request(app.getHttpServer()).get('/api/v1/probe/protected').expect(401));

  it('403 con actor: la política provisional deniega', () =>
    request(app.getHttpServer())
      .get('/api/v1/probe/protected')
      .set('x-test-actor', '1')
      .expect(403));

  it('400 ante campos no declarados', () =>
    request(app.getHttpServer())
      .post('/api/v1/probe/validate')
      .send({ name: 'a', extra: true })
      .expect(400));

  it('400 ante JSON mal formado', () =>
    request(app.getHttpServer())
      .post('/api/v1/probe/validate')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400));

  it('500 sin filtrar detalles internos', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/probe/crash')
      .expect(500);
    expect(res.text).not.toContain('detalle interno');
  });

  it('publica OpenAPI', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(res.body).toHaveProperty(['paths', '/health']);
  });
});
