import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import {
  AccessPolicy,
  DenyAllAccessPolicy,
} from '../../common/security/access-policy';
import type { CurrentActor } from '../../common/security/current-actor';
import type { AuditService } from '../audit/audit.service';
import { CasesService } from './cases.service';
import { IncorporateCaseDto } from './dto/incorporate-case.dto';

function allowAllPolicy(): AccessPolicy {
  return new (class extends AccessPolicy {
    isAllowed(): Promise<boolean> {
      return Promise.resolve(true);
    }
  })();
}

type QueryMock = jest.Mock<Promise<unknown>, [string, unknown[]?]>;

describe('CasesService (unit)', () => {
  const actor: CurrentActor = { id: randomUUID(), roles: ['analyst'] };
  const supervisor: CurrentActor = { id: randomUUID(), roles: ['supervisor'] };

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('denies all case operations when provisional DenyAllAccessPolicy is active', async () => {
    const db = {} as DataSource;
    const mandatoryRead = jest.fn(
      async (
        _event: unknown,
        fn: (tx: EntityManager) => Promise<{ data: unknown }>,
      ) => (await fn({} as EntityManager)).data,
    );
    const audit = { mandatoryRead } as unknown as AuditService;

    const service = new CasesService(db, new DenyAllAccessPolicy(), audit);

    await expect(
      service.incorporateCase(actor, {
        spaceCode: 'trasu_demo',
        originalReference: 'EXP-001',
        sourceKind: 'test_fixture',
        sourceKey: 'unit-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(service.listCases(actor, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.getCaseDetail(actor, randomUUID()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.listIntake(actor, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('incorporates a case atomically with missing_classification incidence and audit', async () => {
    const caseId = randomUUID();
    const refId = randomUUID();
    const intakeId = randomUUID();
    const incidenceId = randomUUID();
    const pgNow = '2026-11-27T18:00:00.123456Z';

    const txQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ code: 'trasu_demo' }])
      .mockResolvedValueOnce([{ iso: pgNow, strictly_after: true }])
      .mockResolvedValueOnce([{ id: caseId }])
      .mockResolvedValueOnce([{ id: refId }])
      .mockResolvedValueOnce([{ id: intakeId }])
      .mockResolvedValueOnce([{ id: incidenceId }])
      .mockResolvedValueOnce([]);

    const tx = { query: txQuery } as unknown as EntityManager;
    const db = {
      transaction: jest.fn((cb: (em: EntityManager) => Promise<unknown>) =>
        cb(tx),
      ),
    } as unknown as DataSource;
    const recordEvent = jest.fn().mockResolvedValue(randomUUID());
    const audit = { recordEvent } as unknown as AuditService;

    const service = new CasesService(db, allowAllPolicy(), audit);
    const result = await service.incorporateCase(actor, {
      spaceCode: 'trasu_demo',
      originalReference: '  EXP-001  ',
      operationalSummary: 'Resumen inicial',
      sourceKind: 'test_fixture',
      sourceKey: 'unit-1',
      institutionalDocuments: [
        {
          externalReference: 'DOC-EXT-1',
          documentKind: 'oficio',
          summary: 'Recepción inicial',
        },
      ],
    });

    expect(result).toEqual({
      outcome: 'confirmed',
      intakeId,
      caseId,
      referenceId: refId,
      incidenceId,
    });
    // Preserves leading/trailing ASCII spaces without trimming in JS.
    expect(txQuery.mock.calls[3]?.[1]?.[2]).toBe('  EXP-001  ');
    expect(recordEvent).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'case:incorporate',
        resourceType: 'intake',
        resourceId: intakeId,
        caseId,
        occurredAt: pgNow,
        kind: 'success',
        resultCode: 'success',
      }),
    );
  });

  it('persists oversized (>256 UTF-8 bytes) reference intact in intake as unresolved without case_record', async () => {
    const intakeId = randomUUID();
    const incidenceId = randomUUID();
    const pgNow = '2026-11-27T18:01:00.000001Z';
    const oversized = 'EXP-' + 'á'.repeat(130);

    const txQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ iso: pgNow, strictly_after: true }])
      .mockResolvedValueOnce([{ id: intakeId }])
      .mockResolvedValueOnce([{ id: incidenceId }]);

    const tx = { query: txQuery } as unknown as EntityManager;
    const db = {
      transaction: jest.fn((cb: (em: EntityManager) => Promise<unknown>) =>
        cb(tx),
      ),
    } as unknown as DataSource;
    const recordEvent = jest.fn().mockResolvedValue(randomUUID());
    const audit = { recordEvent } as unknown as AuditService;

    const service = new CasesService(db, allowAllPolicy(), audit);
    const result = await service.incorporateCase(actor, {
      spaceCode: 'trasu_demo',
      originalReference: oversized,
      sourceKind: 'test_fixture',
      sourceKey: 'unit-oversized',
    });

    expect(result.outcome).toBe('unresolved');
    expect(result.caseId).toBeUndefined();
    expect(txQuery.mock.calls[1]?.[1]?.[1]).toBe(oversized);
    expect(recordEvent).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'case:incorporate',
        resourceType: 'intake',
        resourceId: intakeId,
        kind: 'failure',
        resultCode: 'failure',
      }),
    );
  });

  it('records collision vs duplicate in a subsequent transaction after uq_case_reference_identity conflict', async () => {
    const intakeId = randomUUID();
    const pgNow = '2026-11-27T18:02:00.000001Z';

    const firstTxQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ code: 'trasu_demo' }])
      .mockResolvedValueOnce([{ iso: pgNow, strictly_after: true }])
      .mockResolvedValueOnce([{ id: randomUUID() }])
      .mockRejectedValueOnce({
        driverError: {
          code: '23505',
          constraint: 'uq_case_reference_identity',
        },
      });

    const secondTxQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([
        { classification_code: 'ordinary', evidence_fingerprint: 'fp-1' },
      ])
      .mockResolvedValueOnce([{ iso: pgNow, strictly_after: true }])
      .mockResolvedValueOnce([{ id: intakeId }])
      .mockResolvedValueOnce([]);

    let txCount = 0;
    const db = {
      transaction: jest.fn((cb: (em: EntityManager) => Promise<unknown>) => {
        txCount += 1;
        return cb({
          query: txCount === 1 ? firstTxQuery : secondTxQuery,
        } as unknown as EntityManager);
      }),
    } as unknown as DataSource;

    const recordEvent = jest.fn().mockResolvedValue(randomUUID());
    const audit = { recordEvent } as unknown as AuditService;

    const service = new CasesService(db, allowAllPolicy(), audit);
    await expect(
      service.incorporateCase(actor, {
        spaceCode: 'trasu_demo',
        originalReference: 'EXP-DUP',
        classificationCode: 'special_route',
        sourceKind: 'test_fixture',
        sourceKey: 'unit-collision',
      }),
    ).rejects.toThrow(ConflictException);

    expect(txCount).toBe(2);
    expect(secondTxQuery.mock.calls[2]?.[1]?.[0]).toBe('collision');
    expect(secondTxQuery.mock.calls[3]?.[0]).toContain(
      'INSERT INTO case_incidence',
    );
  });

  it('filters listCases by holder scope before counting and pagination for non-supervisors', async () => {
    const txQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ total: '0' }])
      .mockResolvedValueOnce([]);
    const tx = { query: txQuery } as unknown as EntityManager;

    const mandatoryRead = jest.fn(
      async (
        _event: unknown,
        fn: (em: EntityManager) => Promise<{ data: unknown }>,
      ) => (await fn(tx)).data,
    );
    const audit = { mandatoryRead } as unknown as AuditService;

    const service = new CasesService({} as DataSource, allowAllPolicy(), audit);

    const res = await service.listCases(actor, { reference: 'EXP-SECRET' });
    expect(res).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    expect(txQuery.mock.calls[0]?.[0]).toContain('sr.ended_at IS NULL');
    expect(txQuery.mock.calls[0]?.[1]).toContain(actor.id);

    txQuery.mockResolvedValueOnce([{ total: '0' }]).mockResolvedValueOnce([]);
    await service.listCases(supervisor, { reference: 'EXP-SECRET' });
    expect(txQuery.mock.calls[2]?.[1]).toEqual(['EXP-SECRET']);
  });

  it('returns indistinguishable 404 for out-of-scope or missing case detail and fails closed with 503 on audit failure', async () => {
    const caseId = randomUUID();
    const txQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([]);
    const tx = { query: txQuery } as unknown as EntityManager;

    const mandatoryRead = jest.fn(
      async (
        _event: unknown,
        fn: (em: EntityManager) => Promise<{ data: unknown }>,
      ) => (await fn(tx)).data,
    );
    const audit = { mandatoryRead } as unknown as AuditService;

    const service = new CasesService({} as DataSource, allowAllPolicy(), audit);

    await expect(service.getCaseDetail(actor, caseId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const failingAudit = {
      mandatoryRead: jest
        .fn()
        .mockRejectedValue(new ServiceUnavailableException()),
    } as unknown as AuditService;
    const serviceAuditDown = new CasesService(
      {} as DataSource,
      allowAllPolicy(),
      failingAudit,
    );
    await expect(
      serviceAuditDown.getCaseDetail(supervisor, caseId),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects control characters and blank whitespace in IncorporateCaseDto', async () => {
    const withCtrl = plainToInstance(IncorporateCaseDto, {
      spaceCode: 'trasu_demo',
      originalReference: 'EXP\n001',
      sourceKind: 'manual_entry',
      sourceKey: 'k1',
    });
    expect((await validate(withCtrl)).length).toBeGreaterThan(0);

    const blankRef = plainToInstance(IncorporateCaseDto, {
      spaceCode: 'trasu_demo',
      originalReference: '   ',
      sourceKind: 'manual_entry',
      sourceKey: 'k1',
    });
    expect((await validate(blankRef)).length).toBeGreaterThan(0);
  });
});
