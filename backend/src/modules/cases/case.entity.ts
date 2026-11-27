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

export type SourceKind = 'manual_entry' | 'institutional_feed' | 'test_fixture';

@Entity('identification_space')
@Check(`octet_length(code) BETWEEN 1 AND 80 AND btrim(code) <> ''`)
@Check(`btrim(label) <> ''`)
export class IdentificationSpace {
  @PrimaryColumn('text', { collation: 'C' })
  code: string;

  @Column('text')
  label: string;
}

@Entity('case_record')
@Check(`classification_code IN ('ordinary','special_route')`)
@Check(
  `btrim(operational_summary) <> '' AND char_length(operational_summary) <= 1000`,
)
export class CaseRecord {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('text', { name: 'classification_code', nullable: true })
  classificationCode: 'ordinary' | 'special_route' | null;

  @Column('text', { name: 'operational_summary', nullable: true })
  operationalSummary: string | null;

  @Column('timestamptz', {
    name: 'incorporated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  incorporatedAt: Date;
}

@Entity('case_reference')
@Unique('uq_case_reference_identity', ['spaceCode', 'matchKey'])
@Index('uq_case_reference_primary', ['caseId'], {
  unique: true,
  where: 'is_primary',
})
@Index('ix_case_reference_case', ['caseId'])
@Check(
  `octet_length(original_reference) BETWEEN 1 AND 256 AND original_reference !~ '[[:cntrl:]]'`,
)
@Check(`match_key <> ''`)
@Check(`source_kind IN ('manual_entry','institutional_feed','test_fixture')`)
@Check(`btrim(source_key) <> ''`)
export class CaseReference {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'case_id' })
  caseId: string;

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

  @Column('boolean', { name: 'is_primary' })
  isPrimary: boolean;

  @Column('uuid', { name: 'confirmed_by_id', nullable: true })
  confirmedById: string | null;

  @Column('text', { name: 'source_kind' })
  sourceKind: SourceKind;

  @Column('text', { name: 'source_key' })
  sourceKey: string;

  @Column('timestamptz', {
    name: 'confirmed_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  confirmedAt: Date;

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
  @JoinColumn({ name: 'confirmed_by_id' })
  confirmedBy: Participant | null;
}
