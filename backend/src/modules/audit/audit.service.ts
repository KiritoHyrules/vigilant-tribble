import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { AccessPolicy } from '../../common/security/access-policy';
import type { CurrentActor } from '../../common/security/current-actor';
import { AuditEvent, type AuditKind, type AuditSnapshot } from './audit.entity';

const resources: Readonly<Record<string, string>> = {
  'case:read': 'case',
  'case:incorporate': 'intake',
  'case:assign': 'case',
  'reassignment:request': 'reassignment_request',
  'reassignment:decide': 'reassignment_request',
  'audit:read': 'audit_event',
};
const results: Record<AuditKind, readonly string[]> = {
  success: ['success'],
  failure: ['failure', 'stale_context'],
  denied: ['denied'],
  read: ['success'],
  correction: ['success'],
};
const emitters = [
  'case_service',
  'audit_service',
  'server_ingress',
  'operations_service',
];
const sources = ['manual_entry', 'test_fixture'];
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const sourceKey = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$/;
const instant =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

/** Internal producer input, never a request DTO. */
export interface AuditEventInput {
  actorId?: string;
  emitterCode: string;
  dataSourceKind?: string;
  dataSourceKey?: string;
  correlationId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  caseId?: string;
  scopeKey?: string;
  occurredAt: Date | string;
  kind: AuditKind;
  resultCode: string;
  beforeData?: AuditSnapshot;
  afterData?: AuditSnapshot;
  consultedEventIds?: readonly string[];
  correctsId?: string;
}

function invalid(): never {
  throw new TypeError('Invalid audit evidence.');
}

function snapshot(action: string, value: AuditSnapshot | undefined) {
  if (value === undefined) return null;
  if (
    !['case:assign', 'reassignment:decide'].includes(action) ||
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  )
    invalid();
  const entries = Object.entries(value);
  for (const [key, field] of entries) {
    if (
      key === 'holderId' &&
      (field === null || (typeof field === 'string' && uuid.test(field)))
    )
      continue;
    if (key === 'scope' && (field === 'analyst' || field === 'vocal')) continue;
    invalid();
  }
  return JSON.stringify(Object.fromEntries(entries));
}

@Injectable()
export class AuditService {
  constructor(
    private readonly database: DataSource,
    private readonly policy: AccessPolicy,
  ) {}

  async recordEvent(
    tx: EntityManager,
    event: AuditEventInput,
  ): Promise<string> {
    const runner = tx.queryRunner;
    if (
      !runner ||
      runner.manager !== tx ||
      runner.isReleased ||
      !runner.isTransactionActive ||
      runner.connection !== this.database
    ) {
      throw new TypeError(
        'Audit evidence requires an active transaction manager.',
      );
    }
    if (
      !Object.hasOwn(resources, event.action) ||
      resources[event.action] !== event.resourceType ||
      !Object.hasOwn(results, event.kind) ||
      !results[event.kind].includes(event.resultCode) ||
      !emitters.includes(event.emitterCode) ||
      typeof event.correlationId !== 'string' ||
      !uuid.test(event.correlationId)
    )
      invalid();
    for (const id of [
      event.actorId,
      event.resourceId,
      event.caseId,
      event.correctsId,
    ]) {
      if (id !== undefined && (typeof id !== 'string' || !uuid.test(id)))
        invalid();
    }
    if (
      (event.dataSourceKind === undefined) !==
        (event.dataSourceKey === undefined) ||
      (event.dataSourceKind !== undefined &&
        (!sources.includes(event.dataSourceKind) ||
          (event.dataSourceKind === 'test_fixture' &&
            !['test', 'development'].includes(process.env.NODE_ENV ?? '')) ||
          typeof event.dataSourceKey !== 'string' ||
          !sourceKey.test(event.dataSourceKey)))
    )
      invalid();
    if (
      event.scopeKey !== undefined &&
      !['analyst', 'vocal'].includes(event.scopeKey)
    )
      invalid();
    if ((event.kind === 'correction') !== (event.correctsId !== undefined))
      invalid();
    if (
      event.resourceType === 'case' &&
      event.resourceId !== undefined &&
      event.resourceId.toLowerCase() !== event.caseId?.toLowerCase()
    )
      invalid();
    const refs: unknown = event.consultedEventIds ?? [];
    if (
      (event.consultedEventIds !== undefined &&
        (event.kind !== 'read' || event.action !== 'audit:read')) ||
      !Array.isArray(refs) ||
      !refs.every(
        (id: unknown): id is string => typeof id === 'string' && uuid.test(id),
      ) ||
      new Set(refs.map((id) => id.toLowerCase())).size !== refs.length
    )
      invalid();
    const timestamp =
      event.occurredAt instanceof Date
        ? event.occurredAt.toISOString()
        : event.occurredAt;
    if (typeof timestamp !== 'string' || !instant.test(timestamp)) invalid();
    const before = snapshot(event.action, event.beforeData);
    const after = snapshot(event.action, event.afterData);
    try {
      const rows: { id: string }[] = await tx.query(
        `WITH inserted AS (
           INSERT INTO audit_event (
             correlation_id, actor_id, emitter_code, data_source_kind, data_source_key,
             action, resource_type, resource_id, case_id, scope_key, occurred_at,
             kind, result_code, before_data, after_data, corrects_id
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING id
         ), references_written AS (
           INSERT INTO audit_event_read_ref (event_id, consulted_event_id)
           SELECT inserted.id, consulted.id FROM inserted CROSS JOIN unnest($17::uuid[]) AS consulted(id)
         )
         SELECT id FROM inserted`,
        [
          event.correlationId,
          event.actorId ?? null,
          event.emitterCode,
          event.dataSourceKind ?? null,
          event.dataSourceKey ?? null,
          event.action,
          event.resourceType,
          event.resourceId ?? null,
          event.caseId ?? null,
          event.scopeKey ?? null,
          timestamp,
          event.kind,
          event.resultCode,
          before,
          after,
          event.correctsId ?? null,
          refs,
        ],
      );
      return rows[0].id;
    } catch {
      // Do not propagate ORM errors that can contain SQL parameters.
      throw new ServiceUnavailableException();
    }
  }

  async recordUnsuccessful(event: AuditEventInput): Promise<string> {
    if (event.kind !== 'failure' && event.kind !== 'denied') invalid();
    return this.database.transaction((tx) => this.recordEvent(tx, event));
  }

  /** Consumers perform their own resource authorization inside the callback. */
  async mandatoryRead<T>(
    event: Omit<AuditEventInput, 'kind' | 'resultCode' | 'consultedEventIds'>,
    selectAuthorized: (
      tx: EntityManager,
    ) => Promise<{ data: T; consultedEventIds?: readonly string[] }>,
  ): Promise<T> {
    let selected = false;
    try {
      return await this.database.transaction(async (tx) => {
        const result = await selectAuthorized(tx);
        selected = true;
        await this.recordEvent(tx, {
          ...event,
          kind: 'read',
          resultCode: 'success',
          consultedEventIds: result.consultedEventIds,
        });
        return result.data;
      });
    } catch (error) {
      if (selected && !(error instanceof TypeError))
        throw new ServiceUnavailableException();
      throw error;
    }
  }

  async readEvidence(
    actor: CurrentActor,
    eventId: string,
    correlationId: string,
  ): Promise<AuditEvent | null> {
    return this.mandatoryRead(
      {
        actorId: actor.id,
        correlationId,
        action: 'audit:read',
        resourceType: 'audit_event',
        resourceId: eventId,
        emitterCode: 'audit_service',
        occurredAt: new Date(),
      },
      async (tx) => {
        await this.policy.assertAllowed({
          actor,
          action: 'audit:read',
          resource: { type: 'audit_event', id: eventId },
        });
        const data = await tx.findOneBy(AuditEvent, { id: eventId });
        return { data, consultedEventIds: data ? [data.id] : [] };
      },
    );
  }
}
