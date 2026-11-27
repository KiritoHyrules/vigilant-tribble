import { Column, Entity, PrimaryColumn } from 'typeorm';

export type AuditKind =
  'success' | 'failure' | 'denied' | 'read' | 'correction';
export type AuditSnapshot = Readonly<Record<string, string | null>>;

@Entity('audit_event')
export class AuditEvent {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;
  @Column('uuid', { name: 'correlation_id' })
  correlationId: string;
  @Column('uuid', { name: 'actor_id', nullable: true })
  actorId: string | null;
  @Column('text', { name: 'emitter_code' })
  emitterCode: string;
  @Column('text', { name: 'data_source_kind', nullable: true })
  dataSourceKind: string | null;
  @Column('text', { name: 'data_source_key', nullable: true })
  dataSourceKey: string | null;
  @Column('text')
  action: string;
  @Column('text', { name: 'resource_type' })
  resourceType: string;
  @Column('uuid', { name: 'resource_id', nullable: true })
  resourceId: string | null;
  @Column('uuid', { name: 'case_id', nullable: true })
  caseId: string | null;
  @Column('text', { name: 'scope_key', nullable: true })
  scopeKey: string | null;
  @Column('timestamptz', { name: 'occurred_at' })
  occurredAt: Date;
  @Column('timestamptz', {
    name: 'recorded_at',
    default: () => 'clock_timestamp()',
  })
  recordedAt: Date;
  @Column('text')
  kind: AuditKind;
  @Column('text', { name: 'result_code' })
  resultCode: string;
  @Column('jsonb', { name: 'before_data', nullable: true })
  beforeData: AuditSnapshot | null;
  @Column('jsonb', { name: 'after_data', nullable: true })
  afterData: AuditSnapshot | null;
  @Column('uuid', { name: 'corrects_id', nullable: true })
  correctsId: string | null;
}

@Entity('audit_event_read_ref')
export class AuditEventReadRef {
  @PrimaryColumn('uuid', { name: 'event_id' })
  eventId: string;
  @PrimaryColumn('uuid', { name: 'consulted_event_id' })
  consultedEventId: string;
}
