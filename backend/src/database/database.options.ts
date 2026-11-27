import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '../config/env.validation';

type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;
type PostgresEnvironment = Pick<
  EnvironmentVariables,
  | 'POSTGRES_HOST'
  | 'POSTGRES_PORT'
  | 'POSTGRES_DB'
  | 'POSTGRES_USER'
  | 'POSTGRES_PASSWORD'
>;

/** Configuración única para la aplicación y la CLI de migraciones. */
export function databaseOptions(env: PostgresEnvironment): PostgresOptions {
  return {
    type: 'postgres',
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DB,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    synchronize: false,
    migrationsRun: false,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  };
}
