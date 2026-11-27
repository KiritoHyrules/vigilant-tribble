import { validateEnv } from './env.validation';

const base = {
  POSTGRES_DB: 'db',
  POSTGRES_USER: 'user',
  POSTGRES_PASSWORD: 'local-only',
};

describe('validateEnv', () => {
  it('aplica valores por defecto y convierte números', () => {
    const env = validateEnv({ ...base, POSTGRES_PORT: '5433' });
    expect(env.POSTGRES_PORT).toBe(5433);
    expect(env.PORT).toBe(3000);
  });

  it.each(['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'])(
    'falla si falta %s',
    (name) => {
      expect(() => validateEnv({ ...base, [name]: undefined })).toThrow(name);
    },
  );

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
