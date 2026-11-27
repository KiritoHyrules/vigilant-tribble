import type { MigrationInterface, QueryRunner } from 'typeorm';

export class LocalAuthentication1795827600000 implements MigrationInterface {
  async up(tx: QueryRunner): Promise<void> {
    await tx.query(`
      CREATE TABLE account (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id uuid NOT NULL UNIQUE REFERENCES participant(id) ON DELETE RESTRICT,
        login_key text COLLATE "C" NOT NULL UNIQUE CHECK (login_key ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
        password_hash text NOT NULL CHECK (password_hash <> ''),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        disabled_at timestamptz CHECK (disabled_at >= created_at)
      );
      CREATE TABLE auth_session (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id uuid NOT NULL REFERENCES account(id) ON DELETE RESTRICT,
        token_digest bytea NOT NULL UNIQUE CHECK (octet_length(token_digest) = 32),
        issued_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL CHECK (expires_at > issued_at),
        revoked_at timestamptz CHECK (revoked_at >= issued_at)
      );
      CREATE INDEX ix_auth_session_account ON auth_session(account_id);
    `);
  }

  async down(tx: QueryRunner): Promise<void> {
    await tx.query(`
      DO $auth$
      BEGIN
        LOCK TABLE account, auth_session IN ACCESS EXCLUSIVE MODE;
        IF EXISTS (SELECT 1 FROM account) OR EXISTS (SELECT 1 FROM auth_session) THEN
          RAISE EXCEPTION 'Cannot revert while local accounts or sessions exist.';
        END IF;
        DROP TABLE auth_session;
        DROP TABLE account;
      END
      $auth$;
    `);
  }
}
