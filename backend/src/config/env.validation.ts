import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { parseCorsOrigins } from './cors';
import { loopbackHost } from './loopback';

const participantIds =
  /^(?:\s*[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\s*(?:,\s*[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\s*)*)?$/i;

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST: string = '127.0.0.1';

  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB: string = 'trasu_dev';

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER: string = 'trasu_dev';

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD: string;

  /** Orígenes permitidos, separados por coma. Vacío: sin CORS. */
  @IsString()
  CORS_ORIGINS: string = '';

  @IsIn(['true', 'false'])
  AUTH_ALLOW_LOCAL_HTTP: string = 'false';

  @Matches(/^(?:[A-Za-z0-9_-]{43})?$/)
  AUTH_LOOPBACK_PROXY_SECRET: string = '';

  @Matches(participantIds)
  OPERATIONS_OPERATOR_IDS: string = '';

  @Matches(participantIds)
  AUDIT_READER_IDS: string = '';
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(env);
  if (errors.length > 0) {
    // Solo nombres: nunca imprimir valores, pueden ser secretos.
    const names = errors.map((e) => e.property).join(', ');
    throw new Error(`Variables de entorno inválidas o ausentes: ${names}`);
  }
  const origins = parseCorsOrigins(env.CORS_ORIGINS).map(
    (origin) => new URL(origin),
  );
  if (
    env.NODE_ENV === 'production' &&
    origins.some((origin) => origin.protocol !== 'https:')
  ) {
    throw new Error('Production CORS_ORIGINS must use HTTPS.');
  }
  if (
    env.AUTH_ALLOW_LOCAL_HTTP === 'true' &&
    (env.NODE_ENV !== 'development' ||
      env.AUTH_LOOPBACK_PROXY_SECRET !== '' ||
      !origins.some(
        (origin) =>
          origin.protocol === 'http:' && loopbackHost(origin.hostname),
      ) ||
      origins.some((origin) => !loopbackHost(origin.hostname)))
  ) {
    throw new Error(
      'AUTH_ALLOW_LOCAL_HTTP requires development, explicit loopback CORS_ORIGINS and no proxy secret.',
    );
  }
  return env;
}
