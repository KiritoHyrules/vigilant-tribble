import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

export interface PgClockSample {
  readonly iso: string;
  readonly strictlyAfter: boolean;
}

/**
 * Samples PostgreSQL `clock_timestamp()` inside an active transaction without
 * losing microsecond precision through JS `Date` conversion.
 */
export async function samplePgTimestamp(
  tx: EntityManager,
  mustBeAfterIso?: string,
): Promise<string> {
  const rows: { iso: string; strictly_after: boolean }[] = mustBeAfterIso
    ? await tx.query(
        `SELECT
           to_char(ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS iso,
           (ts > $1::timestamptz) AS strictly_after
         FROM (SELECT clock_timestamp() AS ts) AS sampled`,
        [mustBeAfterIso],
      )
    : await tx.query(
        `SELECT
           to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS iso,
           true AS strictly_after`,
      );

  const row = rows[0];
  if (!row || row.strictly_after !== true) {
    throw new ConflictException(
      'Sampled database clock is not strictly after the prior responsibility start.',
    );
  }
  return row.iso;
}

export function assertSourceKindAllowedForEnv(sourceKind: string): void {
  if (
    sourceKind === 'test_fixture' &&
    !['test', 'development'].includes(process.env.NODE_ENV ?? '')
  ) {
    throw new ConflictException(
      'test_fixture provenance is only allowed in development or test.',
    );
  }
}
