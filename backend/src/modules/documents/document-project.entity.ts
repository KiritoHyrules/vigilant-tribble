import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { CaseRecord } from '../cases/case.entity';

@Entity('document_project')
@Check(`id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab]'`)
@Index('ix_document_project_case', ['caseId'])
export class DocumentProject {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'case_id' })
  caseId: string;

  @ManyToOne(() => CaseRecord, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'case_id' })
  caseRecord: CaseRecord;
}
