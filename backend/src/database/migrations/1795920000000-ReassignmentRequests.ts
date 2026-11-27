import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ReassignmentRequests1795920000000 implements MigrationInterface {
  async up(tx: QueryRunner): Promise<void> {
    await tx.query(`
      CREATE TABLE reassignment_request (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id uuid NOT NULL REFERENCES case_record(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        scope text NOT NULL CHECK (scope IN ('analyst','vocal')),
        expected_responsibility_id uuid NOT NULL REFERENCES responsibility(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        requester_id uuid NOT NULL REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        reason text NOT NULL CHECK (btrim(reason) <> '' AND char_length(reason) <= 2000),
        requested_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        source_kind text NOT NULL CHECK (source_kind IN ('manual_entry','institutional_feed','test_fixture')),
        source_key text NOT NULL CHECK (btrim(source_key) <> ''),
        requires_treatment boolean NOT NULL DEFAULT false,
        treatment_status text CHECK (treatment_status IN ('superseded','ineligible')),
        treated_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        treated_at timestamptz,
        treatment_note text CHECK (treatment_note IS NULL OR (btrim(treatment_note) <> '' AND char_length(treatment_note) <= 2000)),
        predecessor_id uuid REFERENCES reassignment_request(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        decision_outcome text CHECK (decision_outcome IN ('approved','rejected')),
        decided_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        decided_at timestamptz,
        justification text CHECK (justification IS NULL OR (btrim(justification) <> '' AND char_length(justification) <= 2000)),
        successor_responsibility_id uuid UNIQUE REFERENCES responsibility(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        CHECK ((treatment_status IS NULL) = (treated_by_id IS NULL)),
        CHECK ((treatment_status IS NULL) = (treated_at IS NULL)),
        CHECK ((treatment_status IS NULL) = (treatment_note IS NULL)),
        CHECK ((decision_outcome IS NULL) = (decided_by_id IS NULL)),
        CHECK ((decision_outcome IS NULL) = (decided_at IS NULL)),
        CHECK ((decision_outcome IS NULL) = (justification IS NULL)),
        CHECK (
          (decision_outcome = 'approved' AND successor_responsibility_id IS NOT NULL) OR
          (decision_outcome = 'rejected' AND successor_responsibility_id IS NULL) OR
          (decision_outcome IS NULL AND successor_responsibility_id IS NULL)
        ),
        CHECK (NOT (decision_outcome IS NOT NULL AND treatment_status IS NOT NULL)),
        CHECK (NOT (decision_outcome IS NOT NULL AND requires_treatment = true)),
        CHECK (predecessor_id IS DISTINCT FROM id)
      );
      CREATE INDEX ix_reassignment_request_case ON reassignment_request(case_id, requested_at DESC, id);
      CREATE UNIQUE INDEX uq_reassignment_request_active ON reassignment_request(case_id, scope)
        WHERE decision_outcome IS NULL AND treatment_status IS NULL;
      CREATE UNIQUE INDEX uq_reassignment_request_predecessor ON reassignment_request(predecessor_id)
        WHERE predecessor_id IS NOT NULL;

      CREATE TABLE reassignment_stale_attempt (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id uuid NOT NULL REFERENCES reassignment_request(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        expected_responsibility_id uuid NOT NULL REFERENCES responsibility(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        observed_responsibility_id uuid REFERENCES responsibility(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        attempted_by_id uuid NOT NULL REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        attempted_at timestamptz NOT NULL,
        source_kind text NOT NULL CHECK (source_kind IN ('manual_entry','institutional_feed','test_fixture')),
        source_key text NOT NULL CHECK (btrim(source_key) <> '')
      );
      CREATE INDEX ix_reassignment_stale_attempt_request ON reassignment_stale_attempt(request_id, attempted_at DESC, id);
    `);
  }

  async down(tx: QueryRunner): Promise<void> {
    await tx.query(`
      DO $rr_revert$
      BEGIN
        LOCK TABLE reassignment_stale_attempt, reassignment_request IN ACCESS EXCLUSIVE MODE;
        IF EXISTS (SELECT 1 FROM reassignment_stale_attempt)
           OR EXISTS (SELECT 1 FROM reassignment_request) THEN
          RAISE EXCEPTION 'Cannot revert while reassignment requests exist.';
        END IF;
        DROP TABLE reassignment_stale_attempt;
        DROP TABLE reassignment_request;
      END
      $rr_revert$;
    `);
  }
}
