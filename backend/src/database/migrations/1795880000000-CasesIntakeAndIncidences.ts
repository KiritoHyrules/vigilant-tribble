import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CasesIntakeAndIncidences1795880000000 implements MigrationInterface {
  async up(tx: QueryRunner): Promise<void> {
    await tx.query(`
      CREATE TABLE case_intake (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        status text NOT NULL CHECK (status IN ('confirmed','duplicate','collision','unresolved')),
        space_code text COLLATE "C" NOT NULL CHECK (octet_length(space_code) BETWEEN 1 AND 80 AND btrim(space_code) <> ''),
        original_reference text NOT NULL CHECK (octet_length(original_reference) >= 1 AND original_reference !~ '[[:cntrl:]]'),
        match_key text COLLATE "C" GENERATED ALWAYS AS (btrim(original_reference,' ')) STORED NOT NULL CHECK (match_key <> ''),
        evidence_fingerprint text CHECK (evidence_fingerprint IS NULL OR btrim(evidence_fingerprint) <> ''),
        detail text CHECK (detail IS NULL OR (btrim(detail) <> '' AND char_length(detail) <= 1000)),
        case_id uuid REFERENCES case_record(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        submitted_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        source_kind text NOT NULL CHECK (source_kind IN ('manual_entry','institutional_feed','test_fixture')),
        source_key text NOT NULL CHECK (btrim(source_key) <> ''),
        received_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK ((status = 'confirmed') = (case_id IS NOT NULL))
      );
      CREATE INDEX ix_case_intake_space_received ON case_intake(space_code, received_at DESC, id);
      CREATE INDEX ix_case_intake_status_received ON case_intake(status, received_at DESC, id);
      CREATE INDEX ix_case_intake_case ON case_intake(case_id) WHERE case_id IS NOT NULL;

      CREATE TABLE case_incidence (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id uuid REFERENCES case_record(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        intake_id uuid REFERENCES case_intake(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        CHECK (case_id IS NOT NULL OR intake_id IS NOT NULL),
        incidence_kind text NOT NULL CHECK (incidence_kind IN ('missing_classification','reference_collision','unconfirmed_reference','incomplete_facts','operational_block')),
        summary text NOT NULL CHECK (btrim(summary) <> '' AND char_length(summary) <= 1000),
        status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
        recorded_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        resolved_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        resolution_note text CHECK (resolution_note IS NULL OR (btrim(resolution_note) <> '' AND char_length(resolution_note) <= 1000)),
        source_kind text NOT NULL CHECK (source_kind IN ('manual_entry','institutional_feed','test_fixture')),
        source_key text NOT NULL CHECK (btrim(source_key) <> ''),
        recorded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at timestamptz CHECK (resolved_at IS NULL OR resolved_at >= recorded_at),
        CHECK ((status = 'resolved') = (resolved_at IS NOT NULL)),
        CHECK ((status = 'resolved') = (resolution_note IS NOT NULL))
      );
      CREATE INDEX ix_case_incidence_case ON case_incidence(case_id, recorded_at DESC, id);
      CREATE INDEX ix_case_incidence_intake ON case_incidence(intake_id, recorded_at DESC, id);

      CREATE TABLE case_institutional_document_ref (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id uuid NOT NULL REFERENCES case_record(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        space_code text COLLATE "C" NOT NULL REFERENCES identification_space(code) ON UPDATE RESTRICT ON DELETE RESTRICT,
        external_reference text NOT NULL CHECK (octet_length(external_reference) BETWEEN 1 AND 256 AND external_reference !~ '[[:cntrl:]]'),
        document_kind text NOT NULL CHECK (btrim(document_kind) <> '' AND char_length(document_kind) <= 120),
        summary text CHECK (summary IS NULL OR (btrim(summary) <> '' AND char_length(summary) <= 1000)),
        recorded_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
        source_kind text NOT NULL CHECK (source_kind IN ('manual_entry','institutional_feed','test_fixture')),
        source_key text NOT NULL CHECK (btrim(source_key) <> ''),
        received_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_case_inst_doc_ref UNIQUE (case_id, space_code, external_reference)
      );
      CREATE INDEX ix_case_inst_doc_ref_case ON case_institutional_document_ref(case_id, received_at DESC, id);
    `);
  }

  async down(tx: QueryRunner): Promise<void> {
    await tx.query(`
      DO $cases_intake_revert$
      BEGIN
        LOCK TABLE case_institutional_document_ref, case_incidence, case_intake IN ACCESS EXCLUSIVE MODE;
        IF EXISTS (SELECT 1 FROM case_institutional_document_ref)
           OR EXISTS (SELECT 1 FROM case_incidence)
           OR EXISTS (SELECT 1 FROM case_intake) THEN
          RAISE EXCEPTION 'Cannot revert while intake or incidence records exist.';
        END IF;
        DROP TABLE case_institutional_document_ref;
        DROP TABLE case_incidence;
        DROP TABLE case_intake;
      END
      $cases_intake_revert$;
    `);
  }
}
