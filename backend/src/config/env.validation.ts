import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { parseCorsOrigins } from './cors';

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
  parseCorsOrigins(env.CORS_ORIGINS);
  return env;
}
