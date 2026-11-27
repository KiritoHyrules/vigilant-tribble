import { validateEnv } from './env.validation';

const base = {
  POSTGRES_PASSWORD: 'local-only',
};

describe('validateEnv', () => {
  it('aplica valores por defecto y convierte números', () => {
    const env = validateEnv({ ...base, POSTGRES_PORT: '5433' });
    expect(env.POSTGRES_PORT).toBe(5433);
    expect(env.PORT).toBe(3000);
    expect(env.POSTGRES_HOST).toBe('127.0.0.1');
    expect(env.POSTGRES_DB).toBe('trasu_dev');
    expect(env.POSTGRES_USER).toBe('trasu_dev');
  });

  it('falla si falta POSTGRES_PASSWORD', () => {
    expect(() => validateEnv({})).toThrow('POSTGRES_PASSWORD');
  });

  it('rechaza un puerto inválido', () => {
    expect(() => validateEnv({ ...base, PORT: 'abc' })).toThrow('PORT');
  });

  it('rechaza el comodín de CORS', () => {
    expect(() => validateEnv({ ...base, CORS_ORIGINS: '*' })).toThrow('CORS');
  });

  it('no filtra valores en el mensaje de error', () => {
    expect(() => validateEnv({ ...base, PORT: 'secreto' })).not.toThrow(
      /secreto/,
    );
  });
});
