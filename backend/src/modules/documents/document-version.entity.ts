import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Participant } from '../auth/identity.entity';
import { DocumentProject } from './document-project.entity';

@Entity('document_version')
@Check(`id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab]'`)
@Check('version_number > 0')
@Check('octet_length(content) BETWEEN 1 AND 10485760')
@Check('edit_revision >= 0')
@Unique('uq_document_version_project_number', ['projectId', 'versionNumber'])
export class DocumentVersion {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('uuid', { name: 'project_id' })
  projectId: string;

  @Column('integer', { name: 'version_number' })
  versionNumber: number;

  @Column('bytea')
  content: Buffer;

  @Column({
    type: 'bytea',
    name: 'content_sha256',
    asExpression: 'sha256(content)',
    generatedType: 'STORED',
    insert: false,
    update: false,
  })
  readonly contentSha256: Buffer;

  @Column({ type: 'uuid', name: 'author_id', update: false })
  readonly authorId: string;

  @Column({
    type: 'timestamptz',
    name: 'registered_at',
    default: () => 'CURRENT_TIMESTAMP',
    update: false,
  })
  readonly registeredAt: Date;

  // El servicio incrementará el contador solo en una edición condicional exitosa.
  @Column('integer', { name: 'edit_revision', default: 0 })
  editRevision: number;

  // La irreversibilidad del sometimiento la garantizará el trigger PostgreSQL.
  @Column('timestamptz', { name: 'submitted_at', nullable: true })
  submittedAt: Date | null;

  @ManyToOne(() => DocumentProject, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'project_id' })
  project: DocumentProject;

  @ManyToOne(() => Participant, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'author_id' })
  author: Participant;
}
