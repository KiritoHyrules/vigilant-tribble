import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('participant')
@Check(`btrim(display_name) <> ''`)
export class Participant {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column('text', { name: 'display_name' })
  displayName: string;
}

export const roleLabels = {
  analyst: 'Analyst',
  supervisor: 'Supervisor',
  reviewer: 'Reviewer',
  vocal: 'Vocal',
  exchange: 'Exchange operator',
  support: 'Technical support',
  auditor: 'Auditor',
} as const;

@Entity('role')
@Check(
  `code IN ('analyst','supervisor','reviewer','vocal','exchange','support','auditor')`,
)
@Check(`btrim(label) <> ''`)
export class Role {
  @PrimaryColumn('text', { collation: 'C' })
  code: keyof typeof roleLabels;

  @Column('text')
  label: string;
}

@Entity('participant_role')
@Index('ix_participant_role_code', ['roleCode', 'participantId'])
export class ParticipantRole {
  @PrimaryColumn('uuid', { name: 'participant_id' })
  participantId: string;

  @PrimaryColumn('text', { name: 'role_code', collation: 'C' })
  roleCode: Role['code'];

  @Column('timestamptz', {
    name: 'granted_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  grantedAt: Date;

  @ManyToOne(() => Participant, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @ManyToOne(() => Role, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_code' })
  role: Role;
}
