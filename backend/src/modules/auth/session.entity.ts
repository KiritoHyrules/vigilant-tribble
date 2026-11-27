import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('account')
export class Account {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;
  @Column('uuid', { name: 'participant_id', unique: true })
  participantId: string;
  @Column({ type: 'text', name: 'login_key', unique: true, collation: 'C' })
  loginKey: string;
  @Column('text', { name: 'password_hash', select: false })
  passwordHash: string;
  @Column('timestamptz', {
    name: 'created_at',
    default: () => 'clock_timestamp()',
  })
  createdAt: Date;
  @Column('timestamptz', { name: 'disabled_at', nullable: true })
  disabledAt: Date | null;
}

@Entity('auth_session')
export class AuthSession {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;
  @Column('uuid', { name: 'account_id' })
  accountId: string;
  @Column('bytea', { name: 'token_digest', unique: true, select: false })
  tokenDigest: Buffer;
  @Column('timestamptz', { name: 'issued_at' })
  issuedAt: Date;
  @Column('timestamptz', { name: 'expires_at' })
  expiresAt: Date;
  @Column('timestamptz', { name: 'revoked_at', nullable: true })
  revokedAt: Date | null;
}
