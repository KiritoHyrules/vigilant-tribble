import dataSource from '../data-source';
import { roleLabels } from '../../modules/auth/identity.entity';

async function main(): Promise<void> {
  const { NODE_ENV } = process.env;
  if (NODE_ENV !== 'development' && NODE_ENV !== 'test') {
    throw new Error(
      'Demo seed requires NODE_ENV=development or NODE_ENV=test.',
    );
  }
  if (
    dataSource.options.type !== 'postgres' ||
    dataSource.options.host !== '127.0.0.1'
  ) {
    throw new Error('Demo seed requires PostgreSQL on 127.0.0.1.');
  }

  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const databases: { enabled: boolean }[] = await manager.query(
        `SELECT shobj_description(oid, 'pg_database') = $1 AS enabled
         FROM pg_database WHERE datname = current_database()`,
        ['trasu:disposable-demo'],
      );
      if (databases[0]?.enabled !== true) {
        throw new Error(
          'The connected database is not designated for TRASU demo data.',
        );
      }

      // Do not silently combine an existing demo reference with a different case.
      // No target-less ON CONFLICT; other conflicting keys must abort the seed.
      const analyst = '7aa0d006-0000-4000-8000-000000000001';
      const vocal = '7aa0d006-0000-4000-8000-000000000002';
      const caseId = '7aa0d006-0000-4000-8000-000000000003';
      const referenceId = '7aa0d006-0000-4000-8000-000000000004';
      await manager.query(
        `INSERT INTO participant(id,display_name) VALUES ($1,'Demo analyst'),($2,'Demo vocal')
         ON CONFLICT (id) DO NOTHING`,
        [analyst, vocal],
      );
      for (const [code, label] of Object.entries(roleLabels)) {
        await manager.query(
          'INSERT INTO role(code,label) VALUES ($1,$2) ON CONFLICT (code) DO NOTHING',
          [code, label],
        );
      }
      await manager.query(
        `INSERT INTO participant_role(participant_id,role_code) VALUES ($1,'analyst'),($2,'vocal')
         ON CONFLICT (participant_id,role_code) DO NOTHING`,
        [analyst, vocal],
      );
      await manager.query(`
        INSERT INTO identification_space(code,label) VALUES ('be006_demo','Synthetic demo space')
        ON CONFLICT (code) DO NOTHING
      `);
      await manager.query(
        `INSERT INTO case_record(id,classification_code,operational_summary)
         VALUES ($1,'ordinary','Synthetic case for local development')
         ON CONFLICT (id) DO NOTHING`,
        [caseId],
      );
      await manager.query(
        `INSERT INTO case_reference(id,case_id,space_code,original_reference,is_primary,source_kind,source_key)
         VALUES ($1,$2,'be006_demo','DEMO-DATA-001',true,'test_fixture','be006_demo')
         ON CONFLICT (id) DO NOTHING`,
        [referenceId, caseId],
      );
      await manager.query(
        `INSERT INTO responsibility(id,case_id,scope,holder_id,started_at,source_kind,source_key)
         VALUES ('7aa0d006-0000-4000-8000-000000000005',$1,'analyst',$2,CURRENT_TIMESTAMP,'test_fixture','be006_demo'),
                ('7aa0d006-0000-4000-8000-000000000006',$1,'vocal',$3,CURRENT_TIMESTAMP,'test_fixture','be006_demo')
         ON CONFLICT (id) DO NOTHING`,
        [caseId, analyst, vocal],
      );
    });
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Demo seed failed.',
    error instanceof Error ? error.message : '',
  );
  process.exitCode = 1;
});
