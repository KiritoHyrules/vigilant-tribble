import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Participant } from '../auth/identity.entity';
import {
  CaseRecord,
  IdentificationSpace,
  type SourceKind,
} from './case.entity';

export type IntakeStatus =
  'confirmed' | 'duplicate' | 'collision' | 'unresolved';

export type IncidenceKind =
  | 'missing_classification'
  | 'reference_collision'
  | 'unconfirmed_reference'
  | 'incomplete_facts'
  | 'operational_block';

export type IncidenceStatus = 'open' | 'resolved';

@Entity('case_intake')
@Index('ix_case_intake_space_received', { synchronize: false })
@Index('ix_case_intake_status_received', { synchronize: false })
@Index('ix_case_intake_case', ['caseId'], { where: 'case_id IS NOT NULL' })
@Check(`status IN ('confirmed','duplicate','collision','unresolved')`)
@Check(`octet_length(space_code) BETWEEN 1 AND 80 AND btrim(space_code) <> ''`)
@Check(
  `octet_length(original_reference) >= 1 AND original_reference !~ '[[:cntrl:]]'`,
)
@Check(`match_key <> ''`)
@Check(`evidence_fingerprint IS NULL OR btrim(evidence_fingerprint) <> ''`)
@Check(
  `detail IS NULL OR (btrim(detail) <> '' AND char_length(detail) <= 1000)`,
)
@Check(`source_kind IN ('manual_entry','institutional_feed','test_fixture')`)
@Check(`btrim(source_key) <> ''`)
@Check(`(status = 'confirmed') = (case_id IS NOT NULL)`)
export class CaseIntake {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('text')
  status: IntakeStatus;

  @Column({ type: 'text', name: 'space_code', collation: 'C' })
  spaceCode: string;

  @Column('text', { name: 'original_reference' })
  originalReference: string;

  @Column({
    type: 'text',
    name: 'match_key',
    collation: 'C',
    asExpression: `btrim(original_reference,' ')`,
    generatedType: 'STORED',
    insert: false,
    update: false,
  })
  readonly matchKey: string;

  @Column('text', { name: 'evidence_fingerprint', nullable: true })
  evidenceFingerprint: string | null;

  @Column('text', { nullable: true })
  detail: string | null;

  @Column('uuid', { name: 'case_id', nullable: true })
  caseId: string | null;

  @Column('uuid', { name: 'submitted_by_id', nullable: true })
  submittedById: string | null;

  @Column('text', { name: 'source_kind' })
  sourceKind: SourceKind;

  @Column('text', { name: 'source_key' })
  sourceKey: string;

  @Column('timestamptz', {
    name: 'received_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  receivedAt: Date;

  @ManyToOne(() => CaseRecord, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'case_id' })
  caseRecord: CaseRecord | null;

  @ManyToOne(() => Participant, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'submitted_by_id' })
  submittedBy: Participant | null;
}

@Entity('case_incidence')
@Index('ix_case_incidence_case', { synchronize: false })
@Index('ix_case_incidence_intake', { synchronize: false })
@Check(`case_id IS NOT NULL OR intake_id IS NOT NULL`)
@Check(
  `incidence_kind IN ('missing_classification','reference_collision','unconfirmed_reference','incomplete_facts','operational_block')`,
)
@Check(`btrim(summary) <> '' AND char_length(summary) <= 1000`)
@Check(`status IN ('open','resolved')`)
@Check(
  `resolution_note IS NULL OR (btrim(resolution_note) <> '' AND char_length(resolution_note) <= 1000)`,
)
@Check(`source_kind IN ('manual_entry','institutional_feed','test_fixture')`)
@Check(`btrim(source_key) <> ''`)
@Check(`resolved_at IS NULL OR resolved_at >= recorded_at`)
@Check(`(status = 'resolved') = (resolved_at IS NOT NULL)`)
@Check(`(status = 'resolved') = (resolution_note IS NOT NULL)`)
export class CaseIncidence {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'case_id', nullable: true })
  caseId: string | null;

  @Column('uuid', { name: 'intake_id', nullable: true })
  intakeId: string | null;

  @Column('text', { name: 'incidence_kind' })
  incidenceKind: IncidenceKind;

  @Column('text')
  summary: string;

  @Column('text', { default: 'open' })
  status: IncidenceStatus;

  @Column('uuid', { name: 'recorded_by_id', nullable: true })
  recordedById: string | null;

  @Column('uuid', { name: 'resolved_by_id', nullable: true })
  resolvedById: string | null;

  @Column('text', { name: 'resolution_note', nullable: true })
  resolutionNote: string | null;

  @Column('text', { name: 'source_kind' })
  sourceKind: SourceKind;

  @Column('text', { name: 'source_key' })
  sourceKey: string;

  @Column('timestamptz', {
    name: 'recorded_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  recordedAt: Date;

  @Column('timestamptz', { name: 'resolved_at', nullable: true })
  resolvedAt: Date | null;

  @ManyToOne(() => CaseRecord, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'case_id' })
  caseRecord: CaseRecord | null;

  @ManyToOne(() => CaseIntake, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'intake_id' })
  intake: CaseIntake | null;

  @ManyToOne(() => Participant, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy: Participant | null;

  @ManyToOne(() => Participant, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy: Participant | null;
}

@Entity('case_institutional_document_ref')
@Unique('uq_case_inst_doc_ref', ['caseId', 'spaceCode', 'externalReference'])
@Index('ix_case_inst_doc_ref_case', { synchronize: false })
@Check(
  `octet_length(external_reference) BETWEEN 1 AND 256 AND external_reference !~ '[[:cntrl:]]'`,
)
@Check(`btrim(document_kind) <> '' AND char_length(document_kind) <= 120`)
@Check(
  `summary IS NULL OR (btrim(summary) <> '' AND char_length(summary) <= 1000)`,
)
@Check(`source_kind IN ('manual_entry','institutional_feed','test_fixture')`)
@Check(`btrim(source_key) <> ''`)
export class CaseInstitutionalDocumentRef {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'case_id' })
  caseId: string;

  @Column({ type: 'text', name: 'space_code', collation: 'C' })
  spaceCode: string;

  @Column('text', { name: 'external_reference' })
  externalReference: string;

  @Column('text', { name: 'document_kind' })
  documentKind: string;

  @Column('text', { nullable: true })
  summary: string | null;

  @Column('uuid', { name: 'recorded_by_id', nullable: true })
  recordedById: string | null;

  @Column('text', { name: 'source_kind' })
  sourceKind: SourceKind;

  @Column('text', { name: 'source_key' })
  sourceKey: string;

  @Column('timestamptz', {
    name: 'received_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  receivedAt: Date;

  @ManyToOne(() => CaseRecord, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'case_id' })
  caseRecord: CaseRecord;

  @ManyToOne(() => IdentificationSpace, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'space_code' })
  space: IdentificationSpace;

  @ManyToOne(() => Participant, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy: Participant | null;
}
