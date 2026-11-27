import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { DataSource } from 'typeorm';
import { ENV_FILES } from '../config/env.files';
import { validateEnv } from '../config/env.validation';
import { databaseOptions } from './database.options';

// loadEnvFile no sobrescribe variables ya definidas: gana el primer origen.
for (const file of ENV_FILES) {
  if (existsSync(file)) loadEnvFile(file);
}

export default new DataSource({
  ...databaseOptions(validateEnv(process.env)),
  entities: [resolve(__dirname, '../modules/**/*.entity.{ts,js}')],
});
