import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  ServiceUnavailableException,
  type INestApplication,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { AuditService } from '../src/modules/audit/audit.service';
import { hashPassword } from '../src/modules/auth/password';

describe('Local authentication', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  const origin = 'http://127.0.0.1:5173';
  const password = 'Synthetic fixture password only';
  let login: string;
  let actorId: string;
  beforeEach(async () => {
    login = `auth-${randomUUID()}`;
    actorId = randomUUID();
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<INestApplication<App>>();
    app.get(ConfigService).set('CORS_ORIGINS', origin);
    app.get(ConfigService).set('NODE_ENV', 'development');
    app.get(ConfigService).set('AUTH_ALLOW_LOCAL_HTTP', 'true');
    setupApp(app);
    await app.init();
    db = app.get(DataSource);
    await db.query('INSERT INTO participant(id, display_name) VALUES ($1,$2)', [
      actorId,
      'Synthetic account',
    ]);
    await db.query(
      'INSERT INTO role(code,label) VALUES ($1,$2) ON CONFLICT (code) DO NOTHING',
      ['analyst', 'Analyst'],
    );
    await db.query(
      'INSERT INTO participant_role(participant_id,role_code) VALUES ($1,$2)',
      [actorId, 'analyst'],
    );
    await db.query(
      'INSERT INTO account(participant_id, login_key, password_hash) VALUES ($1,$2,$3)',
      [actorId, login, await hashPassword(password)],
    );
  });
  afterEach(async () => {
    await app?.close();
  });

  it('requires a valid session for current identity, regardless of client-supplied roles', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('X-Actor', 'support')
      .set('X-Roles', 'support')
      .expect(401);
  });

  function post(path: string) {
    return request(app.getHttpServer())
      .post(`/api/v1/auth/${path}`)
      .set('Origin', origin)
      .set('X-TRASU-CSRF', '1');
  }

  function overrideConfig(values: Record<string, string>) {
    const config = app.get(ConfigService);
    const get = config.get.bind(config);
    return jest
      .spyOn(config, 'get')
      .mockImplementation((key: string) =>
        Object.hasOwn(values, key) ? values[key] : get<unknown>(key),
      );
  }

  async function signIn(): Promise<string> {
    const response = await post('login').send({ login, password }).expect(204);
    const cookies: unknown = response.headers['set-cookie'];
    if (!Array.isArray(cookies) || typeof cookies[0] !== 'string') {
      throw new Error('Session cookie not received.');
    }
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    expect(cookies[0]).not.toMatch(/;\s*Secure(?:;|$)/);
    return cookies[0].split(';')[0];
  }

  it('rejects unapproved HTTP before issuing a cookie or persisting a session', async () => {
    const config = overrideConfig({
      NODE_ENV: 'production',
      AUTH_ALLOW_LOCAL_HTTP: 'false',
    });
    const before = await sessionFingerprint();
    try {
      for (const forwarded of [false, true]) {
        const attempt = post('login').send({ login, password });
        if (forwarded) {
          attempt.set('X-Forwarded-Proto', 'https');
          attempt.set('Forwarded', 'proto=https');
        }
        const response = await attempt.expect(403);
        expect(response.headers['set-cookie']).toBeUndefined();
        expect(await sessionFingerprint()).toEqual(before);
      }
    } finally {
      config.mockRestore();
    }
  });

  it('accepts HTTPS attested by the configured local proxy, not a forwarded header alone', async () => {
    const secret = randomBytes(32).toString('base64url');
    const httpsOrigin = 'https://app.example';
    const config = overrideConfig({
      NODE_ENV: 'production',
      AUTH_ALLOW_LOCAL_HTTP: 'false',
      AUTH_LOOPBACK_PROXY_SECRET: secret,
      CORS_ORIGINS: httpsOrigin,
    });
    const before = await sessionFingerprint();
    const forwardedLogin = () =>
      post('login')
        .set('Origin', httpsOrigin)
        .set('X-Forwarded-Proto', 'https')
        .send({ login, password });
    try {
      for (const proof of [undefined, randomBytes(32).toString('base64url')]) {
        const attempt = forwardedLogin();
        if (proof) attempt.set('X-TRASU-Proxy-Proof', proof);
        const rejected = await attempt.expect(403);
        expect(rejected.headers['set-cookie']).toBeUndefined();
        expect(await sessionFingerprint()).toEqual(before);
      }
      const response = await forwardedLogin()
        .set('X-TRASU-Proxy-Proof', secret)
        .expect(204);
      expect(response.headers['set-cookie']).toEqual([
        expect.stringMatching(/;\s*HttpOnly; Secure; SameSite=Lax(?:;|$)/),
      ]);
      expect(await sessionFingerprint()).not.toEqual(before);
    } finally {
      config.mockRestore();
    }
  });

  it('limits overlapping attempts from one peer and releases admission after failure', async () => {
    let release!: () => void;
    let entered!: () => void;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const ready = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const audit = app.get(AuditService);
    const original = audit.recordUnsuccessful.bind(audit);
    const spy = jest
      .spyOn(audit, 'recordUnsuccessful')
      .mockImplementationOnce(async (event) => {
        entered();
        await waiting;
        return original(event);
      });
    const first = post('login')
      .send({ login, password: 'incorrect' })
      .then((response) => response);
    try {
      await ready;
      await post('login').send({ login, password }).expect(429);
    } finally {
      release();
      expect((await first).status).toBe(401);
      spy.mockRestore();
    }
    await signIn();
  });

  it('records an oversized UTF-8 credential denial without identifying an account', async () => {
    const secret = '界'.repeat(200);
    const audit = app.get(AuditService);
    const spy = jest.spyOn(audit, 'recordUnsuccessful');
    try {
      const response = await post('login')
        .send({ login, password: secret })
        .expect(401);
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
      const [event] = spy.mock.calls[0];
      expect(event).toMatchObject({ action: 'auth:login', kind: 'denied' });
      expect(event.actorId).toBeUndefined();
      expect(event.resourceId).toBeUndefined();
      const rows: unknown = await db.query(
        `SELECT actor_id, resource_id, before_data, after_data FROM audit_event WHERE correlation_id = $1`,
        [event.correlationId],
      );
      expect(rows).toEqual([
        {
          actor_id: null,
          resource_id: null,
          before_data: null,
          after_data: null,
        },
      ]);
    } finally {
      spy.mockRestore();
    }
  });

  it('omits Secure only for explicitly enabled loopback development login and logout', async () => {
    const response = await post('login').send({ login, password }).expect(204);
    const cookies: unknown = response.headers['set-cookie'];
    expect(cookies).toEqual([
      expect.stringContaining('HttpOnly; SameSite=Lax'),
    ]);
    expect(cookies).toEqual([expect.not.stringMatching(/;\s*Secure(?:;|$)/)]);
    if (!Array.isArray(cookies) || typeof cookies[0] !== 'string')
      throw new Error('Missing cookie.');
    const logout = await post('logout')
      .set('Cookie', cookies[0].split(';')[0])
      .expect(204);
    expect(logout.headers['set-cookie']).toEqual([
      expect.not.stringMatching(/;\s*Secure(?:;|$)/),
    ]);
  });

  it('authenticates against stored hashes and resolves current participant and roles', async () => {
    await post('login').send({ login, password: 'incorrect' }).expect(401);
    await post('login')
      .send({ login: 'nonexistent', password: 'incorrect' })
      .expect(401);
    const cookie = await signIn();
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .set('X-Roles', 'support')
      .expect(200, { id: actorId, roles: ['analyst'] });
    await expect(
      db.query('SELECT id FROM auth_session WHERE token_digest = $1', [
        createHash('sha256').update(cookie.split('=')[1]).digest(),
      ]),
    ).resolves.toHaveLength(1);
  });

  it('refuses cross-origin writes and invalidates the token at logout', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', 'http://outside.example')
      .set('X-TRASU-CSRF', '1')
      .send({ login, password })
      .expect(403);
    const cookie = await signIn();
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', origin)
      .set('Cookie', cookie)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(200);
    await post('logout').set('Cookie', cookie).expect(204);
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(401);
  });

  it('rejects expired sessions', async () => {
    const cookie = await signIn();
    await db.query(
      `UPDATE auth_session SET issued_at = clock_timestamp() - interval '2 hours',
       expires_at = clock_timestamp() - interval '1 hour' WHERE token_digest = $1`,
      [createHash('sha256').update(cookie.split('=')[1]).digest()],
    );
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(401);
  });

  async function sessionFingerprint(): Promise<unknown> {
    return db.query(
      `
      SELECT md5(COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.id)::text, '')) AS fingerprint
      FROM auth_session s JOIN account a ON a.id = s.account_id
      WHERE a.participant_id = $1
    `,
      [actorId],
    );
  }

  it('rolls back session issuance when mandatory login audit fails', async () => {
    const before = await sessionFingerprint();
    const spy = jest
      .spyOn(app.get(AuditService), 'recordEvent')
      .mockRejectedValueOnce(new ServiceUnavailableException());
    try {
      const response = await post('login')
        .send({ login, password })
        .expect(503);
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(await sessionFingerprint()).toEqual(before);
    } finally {
      spy.mockRestore();
    }
  });

  it('rolls back revocation when mandatory logout audit fails', async () => {
    const cookie = await signIn();
    const before = await sessionFingerprint();
    const spy = jest
      .spyOn(app.get(AuditService), 'recordEvent')
      .mockRejectedValueOnce(new ServiceUnavailableException());
    try {
      await post('logout').set('Cookie', cookie).expect(503);
      expect(await sessionFingerprint()).toEqual(before);
    } finally {
      spy.mockRestore();
    }
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(200, { id: actorId, roles: ['analyst'] });
  });

  it('records attributable outcomes without persisting credentials or session tokens in audit', async () => {
    const cookie = await signIn();
    await post('logout').set('Cookie', cookie).expect(204);
    const rows: unknown = await db.query(
      `SELECT action, kind, before_data, after_data FROM audit_event
       WHERE actor_id = $1 AND action IN ('auth:login','auth:logout') ORDER BY action`,
      [actorId],
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        {
          action: 'auth:login',
          kind: 'success',
          before_data: null,
          after_data: null,
        },
        {
          action: 'auth:logout',
          kind: 'success',
          before_data: null,
          after_data: null,
        },
      ]),
    );
    const leaked: unknown = await db.query(
      `SELECT id FROM audit_event WHERE action IN ('auth:login','auth:logout')
       AND (strpos(to_jsonb(audit_event)::text, $1) > 0 OR strpos(to_jsonb(audit_event)::text, $2) > 0)`,
      [password, cookie.split('=')[1]],
    );
    expect(leaked).toEqual([]);
  });
});
