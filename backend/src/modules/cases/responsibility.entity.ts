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

@Entity('responsibility')
@Index('uq_responsibility_current', ['caseId', 'scope'], {
  unique: true,
  where: 'ended_at IS NULL',
})
// The migration owns the DESC ordering, which TypeORM decorators cannot express.
@Index('ix_responsibility_history', { synchronize: false })
@Check(`scope IN ('analyst','vocal')`)
@Check('ended_at IS NULL OR ended_at > started_at')
@Check(`source_kind IN ('manual_entry','institutional_feed','test_fixture')`)
@Check(`btrim(source_key) <> ''`)
export class Responsibility {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'case_id' })
  caseId: string;

  @Column('text')
  scope: 'analyst' | 'vocal';

  @Column('uuid', { name: 'holder_id' })
  holderId: string;

  @Column('timestamptz', { name: 'started_at' })
  startedAt: Date;

  @Column('timestamptz', { name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column('uuid', { name: 'recorded_by_id', nullable: true })
  recordedById: string | null;

  @Column('text', { name: 'source_kind' })
  sourceKind: SourceKind;

  @Column('text', { name: 'source_key' })
  sourceKey: string;

  @ManyToOne(() => CaseRecord, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'case_id' })
  caseRecord: CaseRecord;

  @ManyToOne(() => Participant, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'holder_id' })
  holder: Participant;

  @ManyToOne(() => Participant, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy: Participant | null;
}
