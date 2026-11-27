import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '../config/env.validation';

type PostgresOptions = Extract<DataSourceOptions, { type: 'postgres' }>;

/** Configuración única para la aplicación y la CLI de migraciones. */
export function databaseOptions(env: EnvironmentVariables): PostgresOptions {
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
