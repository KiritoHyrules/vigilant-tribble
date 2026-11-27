import { Test } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { AppModule } from '../src/app.module';
import cli from '../src/database/data-source';
import { CaseReference } from '../src/modules/cases/case.entity';

const tables = [
  'case_record',
  'case_reference',
  'identification_space',
  'participant',
  'participant_role',
  'responsibility',
  'role',
];

describe('BE-006 data foundation (PostgreSQL)', () => {
  it('discovers the same core entities through Nest and CLI', async () => {
    const app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    try {
      await cli.initialize();
      for (const source of [app.get(DataSource), cli]) {
        expect(source.options.synchronize).toBe(false);
        expect(source.options.migrationsRun).toBe(false);
        expect(source.entityMetadatas.map((it) => it.tableName).sort()).toEqual(
          expect.arrayContaining(tables),
        );
      }
    } finally {
      if (cli.isInitialized) await cli.destroy();
      await app.close();
    }
  });

  describe('schema and invalid writes', () => {
    let runner: QueryRunner;
    const caseId = '3af59010-85ce-4f25-95d5-f1ad347a1070';
    const holder = '3af59010-85ce-4f25-95d5-f1ad347a1071';
    const space = 'be006-test-space';

    beforeAll(async () => {
      await cli.initialize();
      runner = cli.createQueryRunner();
      await runner.startTransaction();
      await runner.query(
        'INSERT INTO participant(id, display_name) VALUES ($1,$2)',
        [holder, 'Synthetic integration participant'],
      );
      await runner.query('INSERT INTO case_record(id) VALUES ($1)', [caseId]);
      await runner.query('INSERT INTO identification_space VALUES ($1,$2)', [
        space,
        'Synthetic integration space',
      ]);
      await runner.query(
        `INSERT INTO case_reference(case_id,space_code,original_reference,is_primary,source_kind,source_key)
         VALUES ($1,$2,'  Demo-0001  ',true,'test_fixture','be006-test')`,
        [caseId, space],
      );
      await runner.query(
        `INSERT INTO responsibility(case_id,scope,holder_id,started_at,source_kind,source_key)
         VALUES ($1,'analyst',$2,'2026-01-01T00:00:00Z','test_fixture','be006-test')`,
        [caseId, holder],
      );
    });

    afterAll(async () => {
      if (runner?.isTransactionActive) await runner.rollbackTransaction();
      await runner?.release();
      if (cli.isInitialized) await cli.destroy();
    });

    it('preserves original reference and generates the exact key', async () => {
      const rows: unknown = await runner.query(
        'SELECT original_reference, match_key FROM case_reference WHERE case_id=$1',
        [caseId],
      );
      expect(rows).toEqual([
        { original_reference: '  Demo-0001  ', match_key: 'Demo-0001' },
      ]);
    });

    it('lets PostgreSQL generate and recompute the match key on ORM writes', async () => {
      const references = runner.manager.getRepository(CaseReference);
      const row = await references.save({
        caseId,
        spaceCode: space,
        originalReference: '  Demo-Orm  ',
        matchKey: 'ignored',
        isPrimary: false,
        sourceKind: 'test_fixture',
        sourceKey: 'be006-test',
      });
      expect(await references.findOneByOrFail({ id: row.id })).toMatchObject({
        originalReference: '  Demo-Orm  ',
        matchKey: 'Demo-Orm',
      });
      await references.update(row.id, {
        originalReference: '  Demo-Orm-Updated  ',
        matchKey: 'ignored',
      });
      expect(await references.findOneByOrFail({ id: row.id })).toMatchObject({
        originalReference: '  Demo-Orm-Updated  ',
        matchKey: 'Demo-Orm-Updated',
      });
    });

    it.each([
      [
        'UPDATE case_reference SET match_key = $2 WHERE case_id = $1',
        [caseId, 'override'],
        '428C9',
      ],
      [
        `INSERT INTO case_reference(case_id,space_code,original_reference,is_primary,source_kind,source_key)
         VALUES ($1,$2,'Demo-0001',false,'test_fixture','be006-test')`,
        [caseId, space],
        '23505',
      ],
      [
        `INSERT INTO case_reference(case_id,space_code,original_reference,is_primary,source_kind,source_key)
         VALUES ($1,$2,'Demo-0002',true,'test_fixture','be006-test')`,
        [caseId, space],
        '23505',
      ],
      [
        `INSERT INTO responsibility(case_id,scope,holder_id,started_at,source_kind,source_key)
         VALUES ($1,'analyst',$2,clock_timestamp(),'test_fixture','be006-test')`,
        [caseId, holder],
        '23505',
      ],
      ['DELETE FROM participant WHERE id=$1', [holder], '23503'],
      [
        'UPDATE case_record SET classification_code=$2 WHERE id=$1',
        [caseId, 'invalid'],
        '23514',
      ],
      [
        'UPDATE responsibility SET ended_at=started_at WHERE case_id=$1',
        [caseId],
        '23514',
      ],
    ])('rejects invalid write: %s', async (sql, params, code) => {
      await runner.query('SAVEPOINT invalid_write');
      try {
        await expect(runner.query(sql, params)).rejects.toMatchObject({ code });
      } finally {
        await runner.query('ROLLBACK TO SAVEPOINT invalid_write');
        await runner.query('RELEASE SAVEPOINT invalid_write');
      }
    });
  });
});
