import { randomUUID } from 'node:crypto';
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AccessPolicy } from '../src/common/security/access-policy';
import { AppModule } from '../src/app.module';

describe('Resource attribution', () => {
  let app: TestingModule;
  let db: DataSource;
  let policy: AccessPolicy;
  const holderId = randomUUID();
  const outsiderId = randomUUID();
  const caseId = randomUUID();
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app.get(ConfigService).set('OPERATIONS_OPERATOR_IDS', holderId);
    db = app.get(DataSource);
    policy = app.get(AccessPolicy);
    await db.query(
      `INSERT INTO participant(id, display_name) VALUES ($1,'Synthetic holder'),($2,'Synthetic outsider');
      `,
      [holderId, outsiderId],
    );
    await db.query(
      `INSERT INTO role(code,label) VALUES ('analyst','Analyst'),('support','Support')
       ON CONFLICT (code) DO NOTHING`,
    );
    await db.query(
      `INSERT INTO participant_role VALUES ($1,'analyst',CURRENT_TIMESTAMP),($1,'support',CURRENT_TIMESTAMP),
       ($2,'analyst',CURRENT_TIMESTAMP),($2,'support',CURRENT_TIMESTAMP)`,
      [holderId, outsiderId],
    );
    await db.query(
      `INSERT INTO account(participant_id,login_key,password_hash)
       VALUES ($1,$3,'unusable-test-hash'),($2,$4,'unusable-test-hash')`,
      [holderId, outsiderId, `policy-${holderId}`, `policy-${outsiderId}`],
    );
    await db.query('INSERT INTO case_record(id) VALUES ($1)', [caseId]);
    await db.query(
      `INSERT INTO responsibility(case_id,scope,holder_id,started_at,source_kind,source_key)
       VALUES ($1,'analyst',$2,clock_timestamp(),'test_fixture','be007a')`,
      [caseId, holderId],
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('grants case reads only for the current attributed holder with a matching role', async () => {
    const request = {
      action: 'case:read',
      resource: { type: 'case', id: caseId },
    };
    await expect(
      policy.isAllowed({ ...request, actor: { id: holderId, roles: [] } }),
    ).resolves.toBe(true);
    await expect(
      policy.isAllowed({
        ...request,
        actor: { id: outsiderId, roles: ['analyst'] },
      }),
    ).resolves.toBe(false);
    await expect(
      policy.isAllowed({
        ...request,
        resource: { type: 'case', id: randomUUID() },
        actor: { id: holderId, roles: [] },
      }),
    ).resolves.toBe(false);
    await expect(
      policy.isAllowed({
        ...request,
        action: 'case:assign',
        actor: { id: holderId, roles: ['supervisor'] },
      }),
    ).resolves.toBe(false);
  });

  it('requires both support membership and explicit operations attribution', async () => {
    const request = {
      action: 'operations:open',
      resource: { type: 'operations', id: randomUUID() },
    };
    await expect(
      policy.isAllowed({ ...request, actor: { id: holderId, roles: [] } }),
    ).resolves.toBe(true);
    await expect(
      policy.isAllowed({
        ...request,
        actor: { id: outsiderId, roles: ['support'] },
      }),
    ).resolves.toBe(false);
    await expect(
      policy.isAllowed({
        ...request,
        action: 'operations:unknown',
        actor: { id: holderId, roles: ['support'] },
      }),
    ).resolves.toBe(false);
  });
});
