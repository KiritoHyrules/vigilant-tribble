import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotImplementedException,
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
import { AssignmentsService } from './assignments.service';
import { DecideReassignmentDto } from './dto/decide-reassignment.dto';
import { TreatReassignmentDto } from './dto/treat-reassignment.dto';

function allowAllPolicy(): AccessPolicy {
  return new (class extends AccessPolicy {
    isAllowed(): Promise<boolean> {
      return Promise.resolve(true);
    }
  })();
}

type QueryMock = jest.Mock<Promise<unknown>, [string, unknown[]?]>;

describe('AssignmentsService (unit)', () => {
  const supervisor: CurrentActor = { id: randomUUID(), roles: ['supervisor'] };
  const analystA: CurrentActor = { id: randomUUID(), roles: ['analyst'] };
  const analystB: CurrentActor = { id: randomUUID(), roles: ['analyst'] };

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('denies initial assignment and decision for provisional policy or non-supervisor actor', async () => {
    const db = {} as DataSource;
    const audit = {} as AuditService;

    const deniedService = new AssignmentsService(
      db,
      new DenyAllAccessPolicy(),
      audit,
    );
    await expect(
      deniedService.assignInitial(supervisor, randomUUID(), {
        holderId: analystA.id,
        scope: 'analyst',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const permissiveService = new AssignmentsService(
      db,
      allowAllPolicy(),
      audit,
    );
    await expect(
      permissiveService.assignInitial(analystA, randomUUID(), {
        holderId: analystA.id,
        scope: 'analyst',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      permissiveService.decideReassignment(analystA, randomUUID(), {
        outcome: 'rejected',
        justification: 'No autorizado',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate initial assignment with 409', async () => {
    const caseId = randomUUID();
    const txQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: caseId }])
      .mockResolvedValueOnce([{ participant_id: analystA.id }])
      .mockResolvedValueOnce([{ id: randomUUID() }]);
    const tx = { query: txQuery } as unknown as EntityManager;

    const db = {
      transaction: jest.fn((cb: (em: EntityManager) => Promise<unknown>) =>
        cb(tx),
      ),
    } as unknown as DataSource;

    const service = new AssignmentsService(
      db,
      allowAllPolicy(),
      {} as AuditService,
    );
    await expect(
      service.assignInitial(supervisor, caseId, {
        holderId: analystA.id,
        scope: 'analyst',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows only current holder to request reassignment and blocks duplicate open requests', async () => {
    const caseId = randomUUID();
    const respId = randomUUID();

    const nonHolderQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: caseId }])
      .mockResolvedValueOnce([{ id: respId, holder_id: analystB.id }]);
    const nonHolderTx = { query: nonHolderQuery } as unknown as EntityManager;
    const db1 = {
      transaction: jest.fn((cb: (em: EntityManager) => Promise<unknown>) =>
        cb(nonHolderTx),
      ),
    } as unknown as DataSource;

    const service1 = new AssignmentsService(
      db1,
      allowAllPolicy(),
      {} as AuditService,
    );
    await expect(
      service1.requestReassignment(analystA, caseId, {
        scope: 'analyst',
        reason: 'No soy titular',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const dupQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: caseId }])
      .mockResolvedValueOnce([{ id: respId, holder_id: analystA.id }])
      .mockResolvedValueOnce([{ id: randomUUID() }]);
    const dupTx = { query: dupQuery } as unknown as EntityManager;
    const db2 = {
      transaction: jest.fn((cb: (em: EntityManager) => Promise<unknown>) =>
        cb(dupTx),
      ),
    } as unknown as DataSource;

    const service2 = new AssignmentsService(
      db2,
      allowAllPolicy(),
      {} as AuditService,
    );
    await expect(
      service2.requestReassignment(analystA, caseId, {
        scope: 'analyst',
        reason: 'Segundo intento',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('commits stale evidence and throws 409 after commit when expected_responsibility_id changed', async () => {
    const caseId = randomUUID();
    const reqId = randomUUID();
    const expectedRespId = randomUUID();
    const actualRespId = randomUUID();
    const pgNow = '2026-11-27T18:05:00.654321Z';

    const txQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ case_id: caseId }])
      .mockResolvedValueOnce([{ id: caseId }])
      .mockResolvedValueOnce([
        {
          id: reqId,
          case_id: caseId,
          scope: 'analyst',
          expected_responsibility_id: expectedRespId,
          requires_treatment: false,
          treatment_status: null,
          decision_outcome: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: actualRespId,
          holder_id: analystB.id,
          started_at_iso: '2026-11-27T18:00:00.000001Z',
        },
      ])
      .mockResolvedValueOnce([{ iso: pgNow, strictly_after: true }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    let committed = false;
    const db = {
      transaction: jest.fn(
        async (cb: (em: EntityManager) => Promise<unknown>) => {
          const out = await cb({
            query: txQuery,
          } as unknown as EntityManager);
          committed = true;
          return out;
        },
      ),
    } as unknown as DataSource;

    const recordEvent = jest.fn().mockResolvedValue(randomUUID());
    const audit = { recordEvent } as unknown as AuditService;

    const service = new AssignmentsService(db, allowAllPolicy(), audit);
    await expect(
      service.decideReassignment(supervisor, reqId, {
        outcome: 'approved',
        newHolderId: analystB.id,
        justification: 'Intento obsoleto',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(committed).toBe(true);
    expect(txQuery.mock.calls[5]?.[0]).toContain('requires_treatment = true');
    expect(txQuery.mock.calls[6]?.[0]).toContain(
      'INSERT INTO reassignment_stale_attempt',
    );
    expect(recordEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: 'reassignment:decide',
        kind: 'failure',
        resultCode: 'stale_context',
        occurredAt: pgNow,
      }),
    );
  });

  it('rejects newHolderId when decision outcome is rejected, and disables ineligible treatment pending AuditService', async () => {
    const service = new AssignmentsService(
      {} as DataSource,
      allowAllPolicy(),
      {} as AuditService,
    );

    await expect(
      service.decideReassignment(supervisor, randomUUID(), {
        outcome: 'rejected',
        newHolderId: analystB.id,
        justification: 'Rechazo',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.treatReassignment(supervisor, randomUUID(), {
        outcome: 'ineligible',
        treatmentNote: 'No procede',
        sourceKind: 'test_fixture',
        sourceKey: 'u1',
      }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });

  it('treats stale request as superseded by creating a linked request with predecessor_id', async () => {
    const caseId = randomUUID();
    const oldReqId = randomUUID();
    const newReqId = randomUUID();
    const activeRespId = randomUUID();
    const pgNow = '2026-11-27T18:10:00.111111Z';

    const txQuery: QueryMock = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ case_id: caseId }])
      .mockResolvedValueOnce([{ id: caseId }])
      .mockResolvedValueOnce([
        {
          id: oldReqId,
          case_id: caseId,
          scope: 'analyst',
          requires_treatment: true,
          treatment_status: null,
          decision_outcome: null,
        },
      ])
      .mockResolvedValueOnce([{ id: activeRespId }])
      .mockResolvedValueOnce([{ iso: pgNow, strictly_after: true }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: newReqId }]);

    const tx = { query: txQuery } as unknown as EntityManager;
    const db = {
      transaction: jest.fn((cb: (em: EntityManager) => Promise<unknown>) =>
        cb(tx),
      ),
    } as unknown as DataSource;
    const recordEvent = jest.fn().mockResolvedValue(randomUUID());
    const audit = { recordEvent } as unknown as AuditService;

    const service = new AssignmentsService(db, allowAllPolicy(), audit);
    const result = await service.treatReassignment(supervisor, oldReqId, {
      outcome: 'superseded',
      treatmentNote: 'Contexto actualizado',
      newReason: 'Nueva solicitud tras reasignación intermedia',
      sourceKind: 'test_fixture',
      sourceKey: 'u-treat',
    });

    expect(result).toEqual({
      treatedRequestId: oldReqId,
      treatmentStatus: 'superseded',
      newRequestId: newReqId,
    });
    expect(txQuery.mock.calls[6]?.[1]?.[6]).toBe(oldReqId);
    expect(recordEvent).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'reassignment:request',
        resourceId: newReqId,
        caseId,
        occurredAt: pgNow,
      }),
    );
  });

  it('validates DecideReassignmentDto and TreatReassignmentDto conditionally', async () => {
    const approvedMissingHolder = plainToInstance(DecideReassignmentDto, {
      outcome: 'approved',
      justification: 'Falta newHolderId',
      sourceKind: 'manual_entry',
      sourceKey: 'k1',
    });
    expect((await validate(approvedMissingHolder)).length).toBeGreaterThan(0);

    const rejectedWithoutHolder = plainToInstance(DecideReassignmentDto, {
      outcome: 'rejected',
      justification: 'Se mantiene titular',
      sourceKind: 'manual_entry',
      sourceKey: 'k1',
    });
    expect(await validate(rejectedWithoutHolder)).toHaveLength(0);

    const supersededMissingReason = plainToInstance(TreatReassignmentDto, {
      outcome: 'superseded',
      treatmentNote: 'Nota',
      sourceKind: 'manual_entry',
      sourceKey: 'k1',
    });
    expect((await validate(supersededMissingReason)).length).toBeGreaterThan(0);
  });
});
