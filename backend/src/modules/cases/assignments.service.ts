import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, type EntityManager } from 'typeorm';
import { AccessPolicy } from '../../common/security/access-policy';
import type { CurrentActor } from '../../common/security/current-actor';
import { AuditService } from '../audit/audit.service';
import type { CaseScope } from './cases.constants';
import type { AssignInitialDto } from './dto/assign-initial.dto';
import type { DecideReassignmentDto } from './dto/decide-reassignment.dto';
import type { ReassignmentListQueryDto } from './dto/reassignment-query.dto';
import type {
  AssignInitialResponse,
  ReassignmentRequestDetailResponse,
  ReassignmentRequestItem,
  ReassignmentRequestListResponse,
  StaleAttemptResponse,
  TreatReassignmentResponse,
} from './dto/reassignment-response.dto';
import type { RequestReassignmentDto } from './dto/request-reassignment.dto';
import type { TreatReassignmentDto } from './dto/treat-reassignment.dto';
import { assertSourceKindAllowedForEnv, samplePgTimestamp } from './pg-clock';

interface RequestRow {
  id: string;
  case_id: string;
  scope: CaseScope;
  expected_responsibility_id: string;
  requester_id: string;
  requester_name: string;
  reason: string;
  requested_at: Date;
  requires_treatment: boolean;
  treatment_status: 'superseded' | 'ineligible' | null;
  predecessor_id: string | null;
  decision_outcome: 'approved' | 'rejected' | null;
  decided_by_id: string | null;
  decided_at: Date | null;
  justification: string | null;
  successor_responsibility_id: string | null;
}

function mapRequestItem(row: RequestRow): ReassignmentRequestItem {
  return {
    id: row.id,
    caseId: row.case_id,
    scope: row.scope,
    expectedResponsibilityId: row.expected_responsibility_id,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    reason: row.reason,
    requestedAt: new Date(row.requested_at).toISOString(),
    requiresTreatment: row.requires_treatment,
    treatmentStatus: row.treatment_status,
    predecessorId: row.predecessor_id,
    decisionOutcome: row.decision_outcome,
    decidedById: row.decided_by_id,
    decidedAt: row.decided_at ? new Date(row.decided_at).toISOString() : null,
    justification: row.justification,
    successorResponsibilityId: row.successor_responsibility_id,
  };
}

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly database: DataSource,
    private readonly policy: AccessPolicy,
    private readonly audit: AuditService,
  ) {}

  async assignInitial(
    actor: CurrentActor,
    caseId: string,
    dto: AssignInitialDto,
  ): Promise<AssignInitialResponse> {
    await this.policy.assertAllowed({
      actor,
      action: 'case:assign',
      resource: { type: 'case', id: caseId },
    });
    if (!actor.roles.includes('supervisor')) {
      throw new ForbiddenException(
        'Only a supervisor may assign initial responsibility.',
      );
    }
    assertSourceKindAllowedForEnv(dto.sourceKind);

    const correlationId = randomUUID();
    return this.database.transaction(async (tx) => {
      const caseRows: { id: string }[] = await tx.query(
        'SELECT id FROM case_record WHERE id = $1 FOR UPDATE',
        [caseId],
      );
      if (caseRows.length === 0) {
        throw new NotFoundException('Case not found.');
      }

      const roleRows: { participant_id: string }[] = await tx.query(
        'SELECT participant_id FROM participant_role WHERE participant_id = $1 AND role_code = $2',
        [dto.holderId, dto.scope],
      );
      if (roleRows.length === 0) {
        throw new BadRequestException(
          'Target participant does not hold the required scope role.',
        );
      }

      const existingRows: { id: string }[] = await tx.query(
        'SELECT id FROM responsibility WHERE case_id = $1 AND scope = $2 AND ended_at IS NULL',
        [caseId, dto.scope],
      );
      if (existingRows.length > 0) {
        throw new ConflictException(
          'Scope already has a current holder; use reassignment.',
        );
      }

      const occurredAt = await samplePgTimestamp(tx);
      const inserted: { id: string }[] = await tx.query(
        `INSERT INTO responsibility (
           case_id, scope, holder_id, started_at, recorded_by_id, source_kind, source_key
         ) VALUES ($1, $2, $3, $4::timestamptz, $5, $6, $7)
         RETURNING id`,
        [
          caseId,
          dto.scope,
          dto.holderId,
          occurredAt,
          actor.id,
          dto.sourceKind,
          dto.sourceKey,
        ],
      );
      const responsibilityId = inserted[0].id;

      await this.audit.recordEvent(tx, {
        actorId: actor.id,
        emitterCode: 'case_service',
        dataSourceKind: dto.sourceKind,
        dataSourceKey: dto.sourceKey,
        correlationId,
        action: 'case:assign',
        resourceType: 'case',
        resourceId: caseId,
        caseId,
        scopeKey: dto.scope,
        occurredAt,
        kind: 'success',
        resultCode: 'success',
        beforeData: { holderId: null, scope: dto.scope },
        afterData: { holderId: dto.holderId, scope: dto.scope },
      });

      return {
        responsibilityId,
        caseId,
        scope: dto.scope,
        holderId: dto.holderId,
        startedAt: occurredAt,
      };
    });
  }

  async requestReassignment(
    actor: CurrentActor,
    caseId: string,
    dto: RequestReassignmentDto,
  ): Promise<ReassignmentRequestItem> {
    await this.policy.assertAllowed({
      actor,
      action: 'reassignment:request',
      resource: { type: 'reassignment_request' },
    });
    assertSourceKindAllowedForEnv(dto.sourceKind);

    const correlationId = randomUUID();
    return this.database.transaction(async (tx) => {
      const caseRows: { id: string }[] = await tx.query(
        'SELECT id FROM case_record WHERE id = $1 FOR UPDATE',
        [caseId],
      );
      if (caseRows.length === 0) {
        throw new NotFoundException('Case not found.');
      }

      const activeRows: { id: string; holder_id: string }[] = await tx.query(
        'SELECT id, holder_id FROM responsibility WHERE case_id = $1 AND scope = $2 AND ended_at IS NULL',
        [caseId, dto.scope],
      );
      const active = activeRows[0];
      if (!active) {
        throw new ConflictException(
          'Cannot request reassignment when no current holder exists for this scope.',
        );
      }
      if (active.holder_id !== actor.id) {
        throw new ForbiddenException(
          'Only the current holder may request reassignment.',
        );
      }

      const openRows: { id: string }[] = await tx.query(
        `SELECT id FROM reassignment_request
         WHERE case_id = $1 AND scope = $2
           AND decision_outcome IS NULL AND treatment_status IS NULL`,
        [caseId, dto.scope],
      );
      if (openRows.length > 0) {
        throw new ConflictException(
          'An open reassignment request already exists for this scope.',
        );
      }

      const occurredAt = await samplePgTimestamp(tx);
      const inserted: { id: string }[] = await tx.query(
        `INSERT INTO reassignment_request (
           case_id, scope, expected_responsibility_id, requester_id, reason,
           requested_at, source_kind, source_key
         ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8)
         RETURNING id`,
        [
          caseId,
          dto.scope,
          active.id,
          actor.id,
          dto.reason,
          occurredAt,
          dto.sourceKind,
          dto.sourceKey,
        ],
      );
      const requestId = inserted[0].id;

      await this.audit.recordEvent(tx, {
        actorId: actor.id,
        emitterCode: 'case_service',
        dataSourceKind: dto.sourceKind,
        dataSourceKey: dto.sourceKey,
        correlationId,
        action: 'reassignment:request',
        resourceType: 'reassignment_request',
        resourceId: requestId,
        caseId,
        scopeKey: dto.scope,
        occurredAt,
        kind: 'success',
        resultCode: 'success',
      });

      const detail = await this.loadRequestDetailInTx(tx, requestId);
      return mapRequestItem(detail.row);
    });
  }

  async decideReassignment(
    actor: CurrentActor,
    requestId: string,
    dto: DecideReassignmentDto,
  ): Promise<ReassignmentRequestDetailResponse> {
    await this.policy.assertAllowed({
      actor,
      action: 'reassignment:decide',
      resource: { type: 'reassignment_request', id: requestId },
    });
    if (!actor.roles.includes('supervisor')) {
      throw new ForbiddenException(
        'Only a supervisor may decide a reassignment request.',
      );
    }
    if (dto.outcome === 'rejected' && dto.newHolderId !== undefined) {
      throw new BadRequestException(
        'Rejected decisions must not specify newHolderId.',
      );
    }
    assertSourceKindAllowedForEnv(dto.sourceKind);

    const correlationId = randomUUID();
    const txResult = await this.database.transaction(
      async (
        tx,
      ): Promise<
        | { stale: true }
        | { stale: false; detail: ReassignmentRequestDetailResponse }
      > => {
        const lookup: { case_id: string }[] = await tx.query(
          'SELECT case_id FROM reassignment_request WHERE id = $1',
          [requestId],
        );
        if (lookup.length === 0) {
          throw new NotFoundException('Reassignment request not found.');
        }

        // Lock case_record first (AJ-02), then reassignment_request row.
        await tx.query('SELECT id FROM case_record WHERE id = $1 FOR UPDATE', [
          lookup[0].case_id,
        ]);

        const reqRows: {
          id: string;
          case_id: string;
          scope: CaseScope;
          expected_responsibility_id: string;
          requires_treatment: boolean;
          treatment_status: string | null;
          decision_outcome: string | null;
        }[] = await tx.query(
          `SELECT id, case_id, scope, expected_responsibility_id,
                  requires_treatment, treatment_status, decision_outcome
           FROM reassignment_request
           WHERE id = $1
           FOR UPDATE`,
          [requestId],
        );
        const req = reqRows[0];

        if (req.decision_outcome !== null) {
          throw new ConflictException(
            'Reassignment request already has a functional decision.',
          );
        }
        if (req.treatment_status !== null) {
          throw new ConflictException(
            'Reassignment request has already been resolved through treatment.',
          );
        }
        if (req.requires_treatment) {
          throw new ConflictException(
            'Reassignment request requires treatment; retry refused.',
          );
        }

        const currentRows: {
          id: string;
          holder_id: string;
          started_at_iso: string;
        }[] = await tx.query(
          `SELECT id, holder_id,
                  to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS started_at_iso
           FROM responsibility
           WHERE case_id = $1 AND scope = $2 AND ended_at IS NULL`,
          [req.case_id, req.scope],
        );
        const current = currentRows[0];

        if (!current || current.id !== req.expected_responsibility_id) {
          const occurredAt = await samplePgTimestamp(tx);
          await tx.query(
            'UPDATE reassignment_request SET requires_treatment = true WHERE id = $1',
            [req.id],
          );
          await tx.query(
            `INSERT INTO reassignment_stale_attempt (
               request_id, expected_responsibility_id, observed_responsibility_id,
               attempted_by_id, attempted_at, source_kind, source_key
             ) VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7)`,
            [
              req.id,
              req.expected_responsibility_id,
              current ? current.id : null,
              actor.id,
              occurredAt,
              dto.sourceKind,
              dto.sourceKey,
            ],
          );
          await this.audit.recordEvent(tx, {
            actorId: actor.id,
            emitterCode: 'case_service',
            dataSourceKind: dto.sourceKind,
            dataSourceKey: dto.sourceKey,
            correlationId,
            action: 'reassignment:decide',
            resourceType: 'reassignment_request',
            resourceId: req.id,
            caseId: req.case_id,
            scopeKey: req.scope,
            occurredAt,
            kind: 'failure',
            resultCode: 'stale_context',
            beforeData: {
              holderId: current ? current.holder_id : null,
              scope: req.scope,
            },
          });
          return { stale: true };
        }

        if (dto.outcome === 'approved') {
          const newHolderId = dto.newHolderId!;
          const roleRows: { participant_id: string }[] = await tx.query(
            'SELECT participant_id FROM participant_role WHERE participant_id = $1 AND role_code = $2',
            [newHolderId, req.scope],
          );
          if (roleRows.length === 0) {
            throw new BadRequestException(
              'Target participant does not hold the required scope role.',
            );
          }

          const occurredAt = await samplePgTimestamp(
            tx,
            current.started_at_iso,
          );
          await tx.query(
            'UPDATE responsibility SET ended_at = $1::timestamptz WHERE id = $2',
            [occurredAt, current.id],
          );
          const successorRows: { id: string }[] = await tx.query(
            `INSERT INTO responsibility (
               case_id, scope, holder_id, started_at, recorded_by_id, source_kind, source_key
             ) VALUES ($1, $2, $3, $4::timestamptz, $5, $6, $7)
             RETURNING id`,
            [
              req.case_id,
              req.scope,
              newHolderId,
              occurredAt,
              actor.id,
              dto.sourceKind,
              dto.sourceKey,
            ],
          );
          const successorId = successorRows[0].id;

          await tx.query(
            `UPDATE reassignment_request
             SET decision_outcome = 'approved',
                 decided_by_id = $1,
                 decided_at = $2::timestamptz,
                 justification = $3,
                 successor_responsibility_id = $4
             WHERE id = $5`,
            [actor.id, occurredAt, dto.justification, successorId, req.id],
          );

          await this.audit.recordEvent(tx, {
            actorId: actor.id,
            emitterCode: 'case_service',
            dataSourceKind: dto.sourceKind,
            dataSourceKey: dto.sourceKey,
            correlationId,
            action: 'reassignment:decide',
            resourceType: 'reassignment_request',
            resourceId: req.id,
            caseId: req.case_id,
            scopeKey: req.scope,
            occurredAt,
            kind: 'success',
            resultCode: 'success',
            beforeData: { holderId: current.holder_id, scope: req.scope },
            afterData: { holderId: newHolderId, scope: req.scope },
          });
        } else {
          const occurredAt = await samplePgTimestamp(tx);
          await tx.query(
            `UPDATE reassignment_request
             SET decision_outcome = 'rejected',
                 decided_by_id = $1,
                 decided_at = $2::timestamptz,
                 justification = $3
             WHERE id = $4`,
            [actor.id, occurredAt, dto.justification, req.id],
          );

          await this.audit.recordEvent(tx, {
            actorId: actor.id,
            emitterCode: 'case_service',
            dataSourceKind: dto.sourceKind,
            dataSourceKey: dto.sourceKey,
            correlationId,
            action: 'reassignment:decide',
            resourceType: 'reassignment_request',
            resourceId: req.id,
            caseId: req.case_id,
            scopeKey: req.scope,
            occurredAt,
            kind: 'success',
            resultCode: 'success',
            beforeData: { holderId: current.holder_id, scope: req.scope },
            afterData: { holderId: current.holder_id, scope: req.scope },
          });
        }

        const loaded = await this.loadRequestDetailInTx(tx, req.id);
        return {
          stale: false,
          detail: {
            ...mapRequestItem(loaded.row),
            staleAttempts: loaded.staleAttempts,
          },
        };
      },
    );

    if (txResult.stale) {
      throw new ConflictException(
        'Reassignment request context is stale and requires treatment.',
      );
    }
    return txResult.detail;
  }

  async treatReassignment(
    actor: CurrentActor,
    requestId: string,
    dto: TreatReassignmentDto,
  ): Promise<TreatReassignmentResponse> {
    await this.policy.assertAllowed({
      actor,
      action: 'reassignment:treat',
      resource: { type: 'reassignment_request', id: requestId },
    });
    if (!actor.roles.includes('supervisor')) {
      throw new ForbiddenException(
        'Only a supervisor may treat stale reassignment requests.',
      );
    }
    if (dto.outcome === 'ineligible') {
      throw new NotImplementedException(
        'ineligible treatment without replacement request is disabled pending AuditService action registration (AJ-06).',
      );
    }
    assertSourceKindAllowedForEnv(dto.sourceKind);

    const correlationId = randomUUID();
    return this.database.transaction(async (tx) => {
      const lookup: { case_id: string }[] = await tx.query(
        'SELECT case_id FROM reassignment_request WHERE id = $1',
        [requestId],
      );
      if (lookup.length === 0) {
        throw new NotFoundException('Reassignment request not found.');
      }

      await tx.query('SELECT id FROM case_record WHERE id = $1 FOR UPDATE', [
        lookup[0].case_id,
      ]);

      const reqRows: {
        id: string;
        case_id: string;
        scope: CaseScope;
        requires_treatment: boolean;
        treatment_status: string | null;
        decision_outcome: string | null;
      }[] = await tx.query(
        `SELECT id, case_id, scope, requires_treatment, treatment_status, decision_outcome
         FROM reassignment_request
         WHERE id = $1
         FOR UPDATE`,
        [requestId],
      );
      const req = reqRows[0];
      if (
        !req.requires_treatment ||
        req.treatment_status !== null ||
        req.decision_outcome !== null
      ) {
        throw new ConflictException(
          'Reassignment request is not in requires_treatment state.',
        );
      }

      const activeRows: { id: string }[] = await tx.query(
        'SELECT id FROM responsibility WHERE case_id = $1 AND scope = $2 AND ended_at IS NULL',
        [req.case_id, req.scope],
      );
      const active = activeRows[0];
      if (!active) {
        throw new ConflictException(
          'Cannot create superseded linked request without a current holder.',
        );
      }

      const occurredAt = await samplePgTimestamp(tx);
      await tx.query(
        `UPDATE reassignment_request
         SET treatment_status = 'superseded',
             treated_by_id = $1,
             treated_at = $2::timestamptz,
             treatment_note = $3
         WHERE id = $4`,
        [actor.id, occurredAt, dto.treatmentNote, req.id],
      );

      const newRows: { id: string }[] = await tx.query(
        `INSERT INTO reassignment_request (
           case_id, scope, expected_responsibility_id, requester_id, reason,
           requested_at, predecessor_id, source_kind, source_key
         ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9)
         RETURNING id`,
        [
          req.case_id,
          req.scope,
          active.id,
          actor.id,
          dto.newReason!,
          occurredAt,
          req.id,
          dto.sourceKind,
          dto.sourceKey,
        ],
      );
      const newRequestId = newRows[0].id;

      await this.audit.recordEvent(tx, {
        actorId: actor.id,
        emitterCode: 'case_service',
        dataSourceKind: dto.sourceKind,
        dataSourceKey: dto.sourceKey,
        correlationId,
        action: 'reassignment:request',
        resourceType: 'reassignment_request',
        resourceId: newRequestId,
        caseId: req.case_id,
        scopeKey: req.scope,
        occurredAt,
        kind: 'success',
        resultCode: 'success',
      });

      return {
        treatedRequestId: req.id,
        treatmentStatus: 'superseded',
        newRequestId,
      };
    });
  }

  async listRequests(
    actor: CurrentActor,
    query: ReassignmentListQueryDto,
  ): Promise<ReassignmentRequestListResponse> {
    await this.policy.assertAllowed({
      actor,
      action: 'case:read',
      resource: { type: 'case' },
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const conditions: string[] = [];
    const params: unknown[] = [];
    const pushParam = (val: unknown): string => {
      params.push(val);
      return `$${params.length}`;
    };

    if (!actor.roles.includes('supervisor')) {
      const p = pushParam(actor.id);
      conditions.push(
        `(rr.requester_id = ${p} OR EXISTS (SELECT 1 FROM responsibility sr WHERE sr.case_id = rr.case_id AND sr.holder_id = ${p} AND sr.ended_at IS NULL))`,
      );
    }

    if (query.caseId !== undefined) {
      const p = pushParam(query.caseId);
      conditions.push(`rr.case_id = ${p}`);
    }
    if (query.scope !== undefined) {
      const p = pushParam(query.scope);
      conditions.push(`rr.scope = ${p}`);
    }
    if (query.status === 'pending') {
      conditions.push(
        `rr.decision_outcome IS NULL AND rr.treatment_status IS NULL AND rr.requires_treatment = false`,
      );
    } else if (query.status === 'requires_treatment') {
      conditions.push(
        `rr.requires_treatment = true AND rr.treatment_status IS NULL AND rr.decision_outcome IS NULL`,
      );
    } else if (query.status === 'approved' || query.status === 'rejected') {
      const p = pushParam(query.status);
      conditions.push(`rr.decision_outcome = ${p}`);
    } else if (query.status === 'superseded' || query.status === 'ineligible') {
      const p = pushParam(query.status);
      conditions.push(`rr.treatment_status = ${p}`);
    }

    const whereSql =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows: { total: string }[] = await this.database.query(
      `SELECT COUNT(*)::text AS total FROM reassignment_request rr ${whereSql}`,
      [...params],
    );
    const total = Number(countRows[0]?.total ?? 0);

    const offset = (page - 1) * limit;
    const limitParam = pushParam(limit);
    const offsetParam = pushParam(offset);

    const rows: RequestRow[] = await this.database.query(
      `SELECT rr.*, p.display_name AS requester_name
       FROM reassignment_request rr
       JOIN participant p ON p.id = rr.requester_id
       ${whereSql}
       ORDER BY rr.requested_at DESC, rr.id DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params,
    );

    return {
      data: rows.map(mapRequestItem),
      total,
      page,
      limit,
    };
  }

  async getRequestDetail(
    actor: CurrentActor,
    requestId: string,
  ): Promise<ReassignmentRequestDetailResponse> {
    const capabilityAllowed = await this.policy.isAllowed({
      actor,
      action: 'case:read',
      resource: { type: 'case' },
    });
    if (capabilityAllowed !== true) {
      throw new ForbiddenException();
    }

    const params: unknown[] = [requestId];
    let scopeSql = '';
    if (!actor.roles.includes('supervisor')) {
      params.push(actor.id);
      scopeSql = `AND (rr.requester_id = $2 OR EXISTS (
        SELECT 1 FROM responsibility sr
        WHERE sr.case_id = rr.case_id AND sr.holder_id = $2 AND sr.ended_at IS NULL
      ))`;
    }

    const rows: RequestRow[] = await this.database.query(
      `SELECT rr.*, p.display_name AS requester_name
       FROM reassignment_request rr
       JOIN participant p ON p.id = rr.requester_id
       WHERE rr.id = $1 ${scopeSql}`,
      params,
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Reassignment request not found.');
    }

    const staleAttempts = await this.loadStaleAttempts(
      this.database.manager,
      requestId,
    );
    return {
      ...mapRequestItem(row),
      staleAttempts,
    };
  }

  private async loadRequestDetailInTx(
    tx: EntityManager,
    requestId: string,
  ): Promise<{ row: RequestRow; staleAttempts: StaleAttemptResponse[] }> {
    const rows: RequestRow[] = await tx.query(
      `SELECT rr.*, p.display_name AS requester_name
       FROM reassignment_request rr
       JOIN participant p ON p.id = rr.requester_id
       WHERE rr.id = $1`,
      [requestId],
    );
    const staleAttempts = await this.loadStaleAttempts(tx, requestId);
    return { row: rows[0], staleAttempts };
  }

  private async loadStaleAttempts(
    tx: EntityManager,
    requestId: string,
  ): Promise<StaleAttemptResponse[]> {
    const rows: {
      id: string;
      expected_responsibility_id: string;
      observed_responsibility_id: string | null;
      attempted_by_id: string;
      attempted_at: Date;
    }[] = await tx.query(
      `SELECT id, expected_responsibility_id, observed_responsibility_id,
              attempted_by_id, attempted_at
       FROM reassignment_stale_attempt
       WHERE request_id = $1
       ORDER BY attempted_at DESC, id DESC`,
      [requestId],
    );
    return rows.map((row) => ({
      id: row.id,
      expectedResponsibilityId: row.expected_responsibility_id,
      observedResponsibilityId: row.observed_responsibility_id,
      attemptedById: row.attempted_by_id,
      attemptedAt: new Date(row.attempted_at).toISOString(),
    }));
  }
}
