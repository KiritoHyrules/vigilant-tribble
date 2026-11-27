import { validateEnv } from './env.validation';

describe('Authentication transport configuration', () => {
  const base = { POSTGRES_PASSWORD: 'synthetic-fixture' };

  it('rejects malformed proxy secrets and incompatible local HTTP configuration', () => {
    const secret = 'a'.repeat(43);
    expect(() =>
      validateEnv({ ...base, AUTH_LOOPBACK_PROXY_SECRET: 'short' }),
    ).toThrow('AUTH_LOOPBACK_PROXY_SECRET');
    expect(() =>
      validateEnv({
        ...base,
        AUTH_ALLOW_LOCAL_HTTP: 'true',
        AUTH_LOOPBACK_PROXY_SECRET: secret,
        CORS_ORIGINS: 'http://127.0.0.1:5173',
      }),
    ).toThrow('AUTH_ALLOW_LOCAL_HTTP');
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        AUTH_LOOPBACK_PROXY_SECRET: secret,
        CORS_ORIGINS: 'https://app.example',
      }),
    ).not.toThrow();
  });

  it('defaults to Secure and rejects non-HTTPS production origins', () => {
    expect(validateEnv(base).AUTH_ALLOW_LOCAL_HTTP).toBe('false');
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'http://app.example',
      }),
    ).toThrow('Production CORS_ORIGINS must use HTTPS.');
    expect(
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example',
      }).AUTH_ALLOW_LOCAL_HTTP,
    ).toBe('false');
  });

  it('allows opt-in only in development with explicit loopback origins', () => {
    const local = {
      ...base,
      AUTH_ALLOW_LOCAL_HTTP: 'true',
      CORS_ORIGINS: 'http://127.0.0.1:5173',
    };
    expect(validateEnv(local).AUTH_ALLOW_LOCAL_HTTP).toBe('true');
    expect(() => validateEnv({ ...local, NODE_ENV: 'test' })).toThrow(
      'AUTH_ALLOW_LOCAL_HTTP',
    );
    expect(() =>
      validateEnv({
        ...local,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.example',
      }),
    ).toThrow('AUTH_ALLOW_LOCAL_HTTP');
    expect(() => validateEnv({ ...local, CORS_ORIGINS: '' })).toThrow(
      'AUTH_ALLOW_LOCAL_HTTP',
    );
    expect(() =>
      validateEnv({
        ...local,
        CORS_ORIGINS: `${local.CORS_ORIGINS},https://app.example`,
      }),
    ).toThrow('AUTH_ALLOW_LOCAL_HTTP');
  });
});
