import { join } from 'node:path';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import type { EnvironmentVariables } from '../config/env.validation';

/** Configuración única para la aplicación y la CLI de migraciones. */
export function databaseOptions(
  env: EnvironmentVariables,
): PostgresConnectionOptions {
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
