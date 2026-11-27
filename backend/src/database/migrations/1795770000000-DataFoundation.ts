import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DataFoundation1795770000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE TABLE participant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (btrim(display_name) <> '')
);
CREATE TABLE role (
  code text COLLATE "C" PRIMARY KEY CHECK (code IN ('analyst','supervisor','reviewer','vocal','exchange','support','auditor')),
  label text NOT NULL CHECK (btrim(label) <> '')
);
CREATE TABLE participant_role (
  participant_id uuid NOT NULL REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  role_code text COLLATE "C" NOT NULL REFERENCES role(code) ON UPDATE RESTRICT ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (participant_id,role_code)
);
CREATE INDEX ix_participant_role_code ON participant_role(role_code,participant_id);
CREATE TABLE identification_space (
  code text COLLATE "C" PRIMARY KEY CHECK (octet_length(code) BETWEEN 1 AND 80 AND btrim(code) <> ''),
  label text NOT NULL CHECK (btrim(label) <> '')
);
CREATE TABLE case_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_code text CHECK (classification_code IN ('ordinary','special_route')),
  operational_summary text CHECK (btrim(operational_summary) <> '' AND char_length(operational_summary) <= 1000),
  incorporated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE case_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES case_record(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  space_code text COLLATE "C" NOT NULL REFERENCES identification_space(code) ON UPDATE RESTRICT ON DELETE RESTRICT,
  original_reference text NOT NULL CHECK (octet_length(original_reference) BETWEEN 1 AND 256 AND original_reference !~ '[[:cntrl:]]'),
  match_key text COLLATE "C" GENERATED ALWAYS AS (btrim(original_reference,' ')) STORED NOT NULL CHECK (match_key <> ''),
  is_primary boolean NOT NULL,
  confirmed_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  source_kind text NOT NULL CHECK (source_kind IN ('manual_entry','institutional_feed','test_fixture')),
  source_key text NOT NULL CHECK (btrim(source_key) <> ''),
  confirmed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_case_reference_identity UNIQUE (space_code,match_key)
);
CREATE UNIQUE INDEX uq_case_reference_primary ON case_reference(case_id) WHERE is_primary;
CREATE INDEX ix_case_reference_case ON case_reference(case_id);
CREATE TABLE responsibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES case_record(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  scope text NOT NULL CHECK (scope IN ('analyst','vocal')),
  holder_id uuid NOT NULL REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  started_at timestamptz NOT NULL,
  ended_at timestamptz CHECK (ended_at IS NULL OR ended_at > started_at),
  recorded_by_id uuid REFERENCES participant(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  source_kind text NOT NULL CHECK (source_kind IN ('manual_entry','institutional_feed','test_fixture')),
  source_key text NOT NULL CHECK (btrim(source_key) <> '')
);
CREATE UNIQUE INDEX uq_responsibility_current ON responsibility(case_id,scope) WHERE ended_at IS NULL;
CREATE INDEX ix_responsibility_history ON responsibility(case_id,scope,started_at DESC,id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE responsibility;
      DROP TABLE case_reference;
      DROP TABLE case_record;
      DROP TABLE identification_space;
      DROP TABLE participant_role;
      DROP TABLE role;
      DROP TABLE participant;
    `);
  }
}
