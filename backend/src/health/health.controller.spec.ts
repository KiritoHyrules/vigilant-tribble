import { ServiceUnavailableException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

const controllerWith = (query: () => Promise<unknown>) =>
  new HealthController({ query } as unknown as DataSource);

describe('HealthController', () => {
  it('informa ok si la base responde', async () => {
    await expect(
      controllerWith(() => Promise.resolve([])).check(),
    ).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('responde 503 si la base falla', async () => {
    await expect(
      controllerWith(() => Promise.reject(new Error('down'))).check(),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
