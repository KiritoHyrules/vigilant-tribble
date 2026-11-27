import { ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AccessPolicy } from '../src/common/security/access-policy';
import { DenyAllAccessPolicy } from '../src/common/security/access-policy';
import cli from '../src/database/data-source';
import { AuditEvidence1795824000000 } from '../src/database/migrations/1795824000000-AuditEvidence';
import {
  AuditEvent,
  AuditEventReadRef,
} from '../src/modules/audit/audit.entity';
import {
  AuditService,
  type AuditEventInput,
} from '../src/modules/audit/audit.service';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

function assignment(caseId: string): AuditEventInput {
  return {
    correlationId: randomUUID(),
    emitterCode: 'case_service',
    action: 'case:assign',
    resourceType: 'case',
    resourceId: caseId,
    caseId,
    scopeKey: 'analyst',
    occurredAt: '2026-11-27T00:00:00.123456Z',
    kind: 'success',
    resultCode: 'success',
  };
}

describe('BE-008 audit schema', () => {
  it('refuses rollback without deleting existing audit evidence', async () => {
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const id = await service.recordUnsuccessful({
      ...assignment(randomUUID()),
      resourceId: undefined,
      caseId: undefined,
      kind: 'failure',
      resultCode: 'failure',
    });
    const before = await cli.manager.findOneByOrFail(AuditEvent, { id });
    const runner = cli.createQueryRunner();
    await runner.startTransaction();
    try {
      await expect(
        new AuditEvidence1795824000000().down(runner),
      ).rejects.toThrow(
        'Cannot revert a migration while audit evidence exists.',
      );
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }
    expect(await cli.manager.findOneByOrFail(AuditEvent, { id })).toEqual(
      before,
    );
  });

  it('rejects inactive and released transaction managers', async () => {
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const runner = cli.createQueryRunner();
    await runner.connect();
    try {
      await expect(
        service.recordEvent(runner.manager, assignment(randomUUID())),
      ).rejects.toThrow('active transaction manager');
    } finally {
      await runner.release();
    }
    await expect(
      service.recordEvent(runner.manager, assignment(randomUUID())),
    ).rejects.toThrow('active transaction manager');
  });

  it('does not release data if the audit transaction fails to commit', async () => {
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const runner = cli.createQueryRunner();
    await runner.connect();
    const commit = jest
      .spyOn(runner, 'commitTransaction')
      .mockRejectedValue(new Error('Synthetic commit failure'));
    const createRunner = jest
      .spyOn(cli, 'createQueryRunner')
      .mockReturnValue(runner);
    const correlationId = randomUUID();
    try {
      await expect(
        service.mandatoryRead(
          {
            correlationId,
            emitterCode: 'audit_service',
            action: 'audit:read',
            resourceType: 'audit_event',
            occurredAt: new Date(),
          },
          () =>
            Promise.resolve({
              data: { protected: true },
              consultedEventIds: [],
            }),
        ),
      ).rejects.toMatchObject({ status: 503 });
    } finally {
      createRunner.mockRestore();
      commit.mockRestore();
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      if (!runner.isReleased) await runner.release();
    }
    expect(await cli.manager.countBy(AuditEvent, { correlationId })).toBe(0);
  });

  it('returns 503 without storing evidence when mandatory audit validation fails', async () => {
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const correlationId = randomUUID();
    const consultedId = randomUUID();
    await expect(
      service.mandatoryRead(
        {
          correlationId,
          emitterCode: 'audit_service',
          action: 'audit:read',
          resourceType: 'audit_event',
          occurredAt: new Date(),
        },
        () =>
          Promise.resolve({
            data: { protected: true },
            consultedEventIds: [consultedId, consultedId],
          }),
      ),
    ).rejects.toMatchObject({ status: 503 });
    expect(await cli.manager.countBy(AuditEvent, { correlationId })).toBe(0);
  });

  beforeAll(async () => {
    await cli.initialize();
  });
  afterAll(async () => {
    if (cli.isInitialized) await cli.destroy();
  });
  it('discovers both audit tables and preserves the foundation', async () => {
    const rows: unknown = await cli.query(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = current_schema() AND tablename NOT IN ('migrations','typeorm_metadata')
       ORDER BY tablename`,
    );
    const names = [
      'audit_event',
      'audit_event_read_ref',
      'case_record',
      'case_reference',
      'identification_space',
      'participant',
      'participant_role',
      'responsibility',
      'role',
    ];
    expect(rows).toEqual(names.map((tablename) => ({ tablename })));
    expect(
      cli.entityMetadatas.map((entity) => entity.tableName).sort(),
    ).toEqual(names);
    const app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    try {
      expect(
        app
          .get(DataSource)
          .entityMetadatas.map((entity) => entity.tableName)
          .sort(),
      ).toEqual(names);
      expect(app.get(AuditService)).toBeInstanceOf(AuditService);
    } finally {
      await app.close();
    }
  });

  it('commits business state and evidence and preserves it across reconnection', async () => {
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const caseId = randomUUID();
    const actorId = randomUUID();
    const event = assignment(caseId);
    const id = await cli.transaction(async (tx) => {
      await tx.query('INSERT INTO case_record(id) VALUES ($1)', [caseId]);
      await tx.query(
        'INSERT INTO participant(id, display_name) VALUES ($1,$2)',
        [actorId, 'Test actor'],
      );
      return service.recordEvent(tx, {
        ...event,
        actorId,
        dataSourceKind: 'test_fixture',
        dataSourceKey: 'be008-fixture',
        afterData: { holderId: actorId, scope: 'analyst' },
      });
    });
    await cli.destroy();
    await cli.initialize();
    expect(await cli.manager.findOneByOrFail(AuditEvent, { id })).toMatchObject(
      {
        caseId,
        actorId,
        resourceId: caseId,
        correlationId: event.correlationId,
        emitterCode: 'case_service',
        dataSourceKind: 'test_fixture',
        dataSourceKey: 'be008-fixture',
        afterData: { holderId: actorId, scope: 'analyst' },
      },
    );
    const times: unknown = await cli.query(
      `SELECT occurred_at = $2::timestamptz AS exact, recorded_at > occurred_at AS later
       FROM audit_event WHERE id = $1`,
      [id, event.occurredAt],
    );
    expect(times).toEqual([{ exact: true, later: true }]);
    await expect(
      cli.query('DELETE FROM case_record WHERE id = $1', [caseId]),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('rolls back the business mutation and success evidence and allows separate failure or denial', async () => {
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const caseId = randomUUID();
    const event = assignment(caseId);
    await expect(
      cli.transaction(async (tx) => {
        await tx.query('INSERT INTO case_record(id) VALUES ($1)', [caseId]);
        await service.recordEvent(tx, event);
        // The business write and success evidence must roll back on FK failure.
        await service.recordEvent(tx, { ...event, actorId: randomUUID() });
      }),
    ).rejects.toMatchObject({ status: 503 });
    expect(
      await cli.query('SELECT id FROM case_record WHERE id = $1', [caseId]),
    ).toEqual([]);
    expect(
      await cli.manager.countBy(AuditEvent, {
        correlationId: event.correlationId,
      }),
    ).toBe(0);
    for (const kind of ['failure', 'denied'] as const) {
      const id = await service.recordUnsuccessful({
        ...event,
        resourceId: undefined,
        caseId: undefined,
        kind,
        resultCode: kind,
      });
      expect(
        await cli.manager.findOneByOrFail(AuditEvent, { id }),
      ).toMatchObject({ kind });
    }
  });

  it('rejects unsafe inputs, unbound managers and refs on non-read events', async () => {
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const event = assignment(randomUUID());
    await expect(service.recordEvent(cli.manager, event)).rejects.toThrow(
      'active transaction',
    );
    await cli.transaction(async (tx) => {
      for (const input of [
        { ...event, afterData: { password: 'synthetic-secret' } },
        { ...event, action: 'unknown' },
        { ...event, consultedEventIds: [randomUUID()] },
        {
          ...event,
          dataSourceKind: 'institutional_feed',
          dataSourceKey: 'unverified',
        },
      ]) {
        await expect(service.recordEvent(tx, input)).rejects.toThrow(
          'Invalid audit evidence',
        );
      }
    });
    expect(
      await cli.manager.countBy(AuditEvent, {
        correlationId: event.correlationId,
      }),
    ).toBe(0);
  });

  it('authorizes evidence reads, writes exact links and preserves the corrected original', async () => {
    const actor = { id: randomUUID(), roles: [] };
    const service = new AuditService(cli, new DenyAllAccessPolicy());
    const caseId = randomUUID();
    const event = assignment(caseId);
    const original = await cli.transaction(async (tx) => {
      await tx.query('INSERT INTO case_record(id) VALUES ($1)', [caseId]);
      await tx.query(
        'INSERT INTO participant(id, display_name) VALUES ($1,$2)',
        [actor.id, 'Test reader'],
      );
      return service.recordEvent(tx, event);
    });
    const corrected = await cli.transaction((tx) =>
      service.recordEvent(tx, {
        ...event,
        kind: 'correction',
        correctsId: original,
        afterData: { holderId: actor.id },
      }),
    );
    expect(
      await cli.manager.findOneByOrFail(AuditEvent, { id: original }),
    ).toMatchObject({ afterData: null, kind: 'success' });
    expect(
      await cli.manager.findOneByOrFail(AuditEvent, { id: corrected }),
    ).toMatchObject({ correctsId: original });
    const correlationId = randomUUID();
    await expect(
      service.readEvidence(actor, corrected, correlationId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(await cli.manager.countBy(AuditEvent, { correlationId })).toBe(0);
    const assertAllowed = jest.fn().mockResolvedValue(undefined);
    const policy = { assertAllowed } as unknown as AccessPolicy;
    const reader = new AuditService(cli, policy);
    expect(
      await reader.readEvidence(actor, corrected, correlationId),
    ).toMatchObject({ id: corrected });
    expect(assertAllowed).toHaveBeenCalledWith({
      actor,
      action: 'audit:read',
      resource: { type: 'audit_event', id: corrected },
    });
    const log = await cli.manager.findOneByOrFail(AuditEvent, {
      correlationId,
    });
    expect(
      await cli.manager.findBy(AuditEventReadRef, { eventId: log.id }),
    ).toEqual([{ eventId: log.id, consultedEventId: corrected }]);
    await expect(
      cli.query('INSERT INTO audit_event_read_ref VALUES ($1,$1)', [log.id]),
    ).rejects.toMatchObject({ code: '23514' });
    const failedCorrelation = randomUUID();
    await expect(
      reader.readEvidence(
        { ...actor, id: randomUUID() },
        corrected,
        failedCorrelation,
      ),
    ).rejects.toMatchObject({ status: 503 });
    expect(
      await cli.manager.countBy(AuditEvent, {
        correlationId: failedCorrelation,
      }),
    ).toBe(0);
  });
});
