import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Participant } from '../auth/identity.entity';
import { CaseRecord, type SourceKind } from './case.entity';
import { Responsibility } from './responsibility.entity';

export type DecisionOutcome = 'approved' | 'rejected';
export type TreatmentStatus = 'superseded' | 'ineligible';

@Entity('reassignment_request')
@Index('ix_reassignment_request_case', { synchronize: false })
@Index('uq_reassignment_request_active', ['caseId', 'scope'], {
  unique: true,
  where: 'decision_outcome IS NULL AND treatment_status IS NULL',
})
@Index('uq_reassignment_request_predecessor', ['predecessorId'], {
  unique: true,
  where: 'predecessor_id IS NOT NULL',
})
@Check(`scope IN ('analyst','vocal')`)
@Check(`btrim(reason) <> '' AND char_length(reason) <= 2000`)
@Check(`source_kind IN ('manual_entry','institutional_feed','test_fixture')`)
@Check(`btrim(source_key) <> ''`)
@Check(`treatment_status IN ('superseded','ineligible')`)
@Check(
  `treatment_note IS NULL OR (btrim(treatment_note) <> '' AND char_length(treatment_note) <= 2000)`,
)
@Check(`(treatment_status IS NULL) = (treated_by_id IS NULL)`)
@Check(`(treatment_status IS NULL) = (treated_at IS NULL)`)
@Check(`(treatment_status IS NULL) = (treatment_note IS NULL)`)
@Check(`decision_outcome IN ('approved','rejected')`)
@Check(
  `justification IS NULL OR (btrim(justification) <> '' AND char_length(justification) <= 2000)`,
)
@Check(`(decision_outcome IS NULL) = (decided_by_id IS NULL)`)
@Check(`(decision_outcome IS NULL) = (decided_at IS NULL)`)
@Check(`(decision_outcome IS NULL) = (justification IS NULL)`)
@Check(
  `(decision_outcome = 'approved' AND successor_responsibility_id IS NOT NULL) OR ` +
    `(decision_outcome = 'rejected' AND successor_responsibility_id IS NULL) OR ` +
    `(decision_outcome IS NULL AND successor_responsibility_id IS NULL)`,
)
@Check(`NOT (decision_outcome IS NOT NULL AND treatment_status IS NOT NULL)`)
@Check(`NOT (decision_outcome IS NOT NULL AND requires_treatment = true)`)
@Check(`predecessor_id IS DISTINCT FROM id`)
export class ReassignmentRequest {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'case_id' })
  caseId: string;

  @Column('text')
  scope: 'analyst' | 'vocal';

  @Column('uuid', { name: 'expected_responsibility_id' })
  expectedResponsibilityId: string;

  @Column('uuid', { name: 'requester_id' })
  requesterId: string;

  @Column('text')
  reason: string;

  @Column('timestamptz', {
    name: 'requested_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  requestedAt: Date;

  @Column('text', { name: 'source_kind' })
  sourceKind: SourceKind;

  @Column('text', { name: 'source_key' })
  sourceKey: string;

  @Column('boolean', { name: 'requires_treatment', default: false })
  requiresTreatment: boolean;

  @Column('text', { name: 'treatment_status', nullable: true })
  treatmentStatus: TreatmentStatus | null;

  @Column('uuid', { name: 'treated_by_id', nullable: true })
  treatedById: string | null;

  @Column('timestamptz', { name: 'treated_at', nullable: true })
  treatedAt: Date | null;

  @Column('text', { name: 'treatment_note', nullable: true })
  treatmentNote: string | null;

  @Column('uuid', { name: 'predecessor_id', nullable: true })
  predecessorId: string | null;

  @Column('text', { name: 'decision_outcome', nullable: true })
  decisionOutcome: DecisionOutcome | null;

  @Column('uuid', { name: 'decided_by_id', nullable: true })
  decidedById: string | null;

  @Column('timestamptz', { name: 'decided_at', nullable: true })
  decidedAt: Date | null;

  @Column('text', { nullable: true })
  justification: string | null;

  @Column('uuid', {
    name: 'successor_responsibility_id',
    nullable: true,
    unique: true,
  })
  successorResponsibilityId: string | null;

  @ManyToOne(() => CaseRecord, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'case_id' })
  caseRecord: CaseRecord;

  @ManyToOne(() => Responsibility, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'expected_responsibility_id' })
  expectedResponsibility: Responsibility;

  @ManyToOne(() => Participant, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'requester_id' })
  requester: Participant;

  @ManyToOne(() => Participant, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'treated_by_id' })
  treatedBy: Participant | null;

  @ManyToOne(() => ReassignmentRequest, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'predecessor_id' })
  predecessor: ReassignmentRequest | null;

  @ManyToOne(() => Participant, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'decided_by_id' })
  decidedBy: Participant | null;

  @ManyToOne(() => Responsibility, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'successor_responsibility_id' })
  successorResponsibility: Responsibility | null;
}

@Entity('reassignment_stale_attempt')
@Index('ix_reassignment_stale_attempt_request', { synchronize: false })
@Check(`source_kind IN ('manual_entry','institutional_feed','test_fixture')`)
@Check(`btrim(source_key) <> ''`)
export class ReassignmentStaleAttempt {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'request_id' })
  requestId: string;

  @Column('uuid', { name: 'expected_responsibility_id' })
  expectedResponsibilityId: string;

  @Column('uuid', { name: 'observed_responsibility_id', nullable: true })
  observedResponsibilityId: string | null;

  @Column('uuid', { name: 'attempted_by_id' })
  attemptedById: string;

  @Column('timestamptz', { name: 'attempted_at' })
  attemptedAt: Date;

  @Column('text', { name: 'source_kind' })
  sourceKind: SourceKind;

  @Column('text', { name: 'source_key' })
  sourceKey: string;

  @ManyToOne(() => ReassignmentRequest, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'request_id' })
  request: ReassignmentRequest;

  @ManyToOne(() => Responsibility, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'expected_responsibility_id' })
  expectedResponsibility: Responsibility;

  @ManyToOne(() => Responsibility, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'observed_responsibility_id' })
  observedResponsibility: Responsibility | null;

  @ManyToOne(() => Participant, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'attempted_by_id' })
  attemptedBy: Participant;
}
