import { resolve } from 'node:path';

/** backend/.env tiene prioridad sobre el .env de la raíz (el de Compose). */
export const ENV_FILES = [
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '../../../.env'),
];
