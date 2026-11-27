import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditEvidence1795824000000 implements MigrationInterface {
  async up(tx: QueryRunner): Promise<void> {
    await tx.query(`
      CREATE TABLE audit_event (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        correlation_id uuid NOT NULL,
        actor_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        emitter_code text NOT NULL,
        data_source_kind text,
        data_source_key text,
        action text NOT NULL,
        resource_type text NOT NULL,
        resource_id uuid,
        case_id uuid REFERENCES case_record(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        scope_key text,
        occurred_at timestamptz NOT NULL,
        recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        kind text NOT NULL CHECK (kind IN ('success','failure','denied','read','correction')),
        result_code text NOT NULL,
        before_data jsonb CHECK (jsonb_typeof(before_data) = 'object'),
        after_data jsonb CHECK (jsonb_typeof(after_data) = 'object'),
        corrects_id uuid REFERENCES audit_event(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        CHECK ((data_source_kind IS NULL) = (data_source_key IS NULL)),
        CHECK ((kind = 'correction') = (corrects_id IS NOT NULL) AND corrects_id IS DISTINCT FROM id)
      );
      CREATE INDEX ix_audit_event_case ON audit_event(case_id, occurred_at, id);
      CREATE INDEX ix_audit_event_resource ON audit_event(resource_type, resource_id, occurred_at, id);
      CREATE INDEX ix_audit_event_correlation ON audit_event(correlation_id);
      CREATE TABLE audit_event_read_ref (
        event_id uuid REFERENCES audit_event(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        consulted_event_id uuid REFERENCES audit_event(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        PRIMARY KEY (event_id, consulted_event_id),
        CHECK (event_id <> consulted_event_id)
      );
      CREATE INDEX ix_audit_event_read_ref_consulted ON audit_event_read_ref(consulted_event_id);
    `);
  }

  async down(tx: QueryRunner): Promise<void> {
    await tx.query(`
      DO $audit_revert$
      BEGIN
        LOCK TABLE audit_event, audit_event_read_ref IN ACCESS EXCLUSIVE MODE;
        IF EXISTS (SELECT 1 FROM audit_event) OR EXISTS (SELECT 1 FROM audit_event_read_ref) THEN
          RAISE EXCEPTION 'Cannot revert a migration while audit evidence exists.';
        END IF;
        DROP TABLE audit_event_read_ref;
        DROP TABLE audit_event;
      END
      $audit_revert$;
    `);
  }
}
