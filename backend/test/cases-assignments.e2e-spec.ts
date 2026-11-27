import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import {
  AccessPolicy,
  type AccessRequest,
} from '../src/common/security/access-policy';
import type { CurrentActor } from '../src/common/security/current-actor';
import { AuditService } from '../src/modules/audit/audit.service';

class TestPermissivePolicy extends AccessPolicy {
  private readonly deniedActors = new Set<string>();

  denyActor(actorId: string): void {
    this.deniedActors.add(actorId);
  }

  isAllowed(req: AccessRequest): Promise<boolean> {
    return Promise.resolve(!this.deniedActors.has(req.actor.id));
  }
}

describe('BE-003 / BE-007b / BE-011 Cases and assignments (e2e, PostgreSQL)', () => {
  let closedApp: INestApplication<App>;
  let app: INestApplication<App>;
  let db: DataSource;
  let policy: TestPermissivePolicy;

  const spaceCode = `be007b_${randomUUID().slice(0, 8)}`;
  const supervisorId = randomUUID();
  const analyst1Id = randomUUID();
  const analyst2Id = randomUUID();
  const vocalId = randomUUID();

  function actorHeaders(id: string, roles: string[]): Record<string, string> {
    return {
      'x-test-actor-id': id,
      'x-test-actor-roles': roles.join(','),
    };
  }

  function attachTestActorMiddleware(targetApp: INestApplication): void {
    targetApp.use(
      (
        req: { headers: Record<string, unknown>; actor?: CurrentActor },
        _res: unknown,
        next: () => void,
      ) => {
        const actorId = req.headers['x-test-actor-id'];
        if (typeof actorId === 'string' && actorId.length > 0) {
          const rawRoles = req.headers['x-test-actor-roles'];
          const roles =
            typeof rawRoles === 'string' && rawRoles.length > 0
              ? rawRoles.split(',')
              : [];
          req.actor = { id: actorId, roles };
        }
        next();
      },
    );
  }

  beforeAll(async () => {
    // 1. Default fail-closed app (provisional DenyAllAccessPolicy)
    const closedMod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    closedApp = closedMod.createNestApplication();
    attachTestActorMiddleware(closedApp);
    setupApp(closedApp);
    await closedApp.init();

    // 2. App with test-only AccessPolicy simulating BE-007a grants
    policy = new TestPermissivePolicy();
    const openMod = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AccessPolicy)
      .useValue(policy)
      .compile();

    app = openMod.createNestApplication();
    attachTestActorMiddleware(app);
    setupApp(app);
    await app.init();

    db = app.get(DataSource);
    await db.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO participant(id, display_name) VALUES
         ($1, 'Supervisor Test'),
         ($2, 'Analyst 1 Test'),
         ($3, 'Analyst 2 Test'),
         ($4, 'Vocal Test')`,
        [supervisorId, analyst1Id, analyst2Id, vocalId],
      );
      await tx.query(
        `INSERT INTO role(code, label) VALUES
         ('supervisor', 'Supervisor'),
         ('analyst', 'Analyst'),
         ('vocal', 'Vocal')
         ON CONFLICT (code) DO NOTHING`,
      );
      await tx.query(
        `INSERT INTO participant_role(participant_id, role_code) VALUES
         ($1, 'supervisor'),
         ($2, 'analyst'),
         ($3, 'analyst'),
         ($4, 'vocal')`,
        [supervisorId, analyst1Id, analyst2Id, vocalId],
      );
      await tx.query(
        `INSERT INTO identification_space(code, label) VALUES ($1, 'BE-007b Test Space')`,
        [spaceCode],
      );
    });
  });

  afterAll(async () => {
    await closedApp?.close();
    await app?.close();
  });

  it('rejects unauthenticated requests (401) and provisional DenyAllAccessPolicy (403)', async () => {
    await request(closedApp.getHttpServer()).get('/api/v1/cases').expect(401);
    await request(closedApp.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .send({})
      .expect(401);

    await request(closedApp.getHttpServer())
      .get('/api/v1/cases')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .expect(403);
    await request(closedApp.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        spaceCode,
        originalReference: 'REF-DENIED',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-deny',
      })
      .expect(403);
  });

  it('incorporates case atomically, handles missing classification, duplicate, collision, and >256 byte unresolved intake', async () => {
    const rawRef = '  EXP-E2E-001  ';
    const created = await request(app.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        spaceCode,
        originalReference: rawRef,
        operationalSummary: 'Caso de prueba BE-007b',
        concordanceKey: 'fp-001',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-inc',
        institutionalDocuments: [
          {
            externalReference: 'DOC-INST-01',
            documentKind: 'recurso',
            summary: 'Documento recibido',
          },
        ],
      })
      .expect(201);

    const caseId = (created.body as { caseId: string }).caseId;
    expect(created.body).toMatchObject({
      outcome: 'confirmed',
      caseId,
    });

    // Missing classification creates open missing_classification incidence and blocks ordinary analysis readiness.
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/cases/${caseId}`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .expect(200);
    expect(detail.body).toMatchObject({
      id: caseId,
      classificationCode: null,
      readiness: {
        classificationStatus: 'missing',
        ordinaryAnalysisReady: false,
      },
    });
    expect(
      (detail.body as { primaryReference: { originalReference: string } })
        .primaryReference.originalReference,
    ).toBe(rawRef);

    // Concordant duplicate -> 409 without leaking winning caseId.
    const dupRes = await request(app.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        spaceCode,
        originalReference: 'EXP-E2E-001',
        concordanceKey: 'fp-001',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-dup',
      })
      .expect(409);
    expect(JSON.stringify(dupRes.body)).not.toContain(caseId);

    // Contradictory collision -> 409 + collision intake + incidence.
    await request(app.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        spaceCode,
        originalReference: 'EXP-E2E-001',
        classificationCode: 'ordinary',
        concordanceKey: 'fp-other',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-col',
      })
      .expect(409);

    // >256 UTF-8 bytes -> 202 unresolved intake without creating case_record.
    const oversized = 'EXP-LONG-' + 'é'.repeat(130);
    const unresolvedRes = await request(app.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        spaceCode,
        originalReference: oversized,
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-long',
      })
      .expect(202);
    expect(unresolvedRes.body).toMatchObject({
      outcome: 'unresolved',
    });
    expect(unresolvedRes.body).not.toHaveProperty('caseId');
  });

  it('enforces scope filtering before pagination and returns indistinguishable 404 for out-of-scope and missing cases', async () => {
    const c1 = await request(app.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        spaceCode,
        originalReference: 'EXP-SCOPE-A1',
        classificationCode: 'ordinary',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-scope',
      })
      .expect(201);
    const caseIdA1 = (c1.body as { caseId: string }).caseId;

    await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseIdA1}/assignments`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        holderId: analyst1Id,
        scope: 'analyst',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-scope',
      })
      .expect(201);

    // Analyst 2 cannot discover caseIdA1 via search or detail (404 indistinguishable from random UUID).
    const listA2 = await request(app.getHttpServer())
      .get('/api/v1/cases')
      .query({ reference: 'EXP-SCOPE-A1' })
      .set(actorHeaders(analyst2Id, ['analyst']))
      .expect(200);
    expect(listA2.body).toMatchObject({ data: [], total: 0 });

    const outOfScope = await request(app.getHttpServer())
      .get(`/api/v1/cases/${caseIdA1}`)
      .set(actorHeaders(analyst2Id, ['analyst']))
      .expect(404);
    const nonExistent = await request(app.getHttpServer())
      .get(`/api/v1/cases/${randomUUID()}`)
      .set(actorHeaders(analyst2Id, ['analyst']))
      .expect(404);
    expect((outOfScope.body as { message: string }).message).toBe(
      (nonExistent.body as { message: string }).message,
    );

    // Mandatory read failure returns 503 without leaking data.
    const audit = app.get(AuditService);
    const spy = jest
      .spyOn(audit, 'recordEvent')
      .mockRejectedValueOnce(new Error('Forced audit outage'));
    try {
      const failRes = await request(app.getHttpServer())
        .get(`/api/v1/cases/${caseIdA1}`)
        .set(actorHeaders(analyst1Id, ['analyst']))
        .expect(503);
      expect(JSON.stringify(failRes.body)).not.toContain('EXP-SCOPE-A1');
    } finally {
      spy.mockRestore();
    }
  });

  it('executes full BE-011 lifecycle: initial assignment, reassignment, concurrent double decision, and stale treatment', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/cases/incorporate')
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        spaceCode,
        originalReference: 'EXP-BE011-01',
        classificationCode: 'ordinary',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(201);
    const caseId = (created.body as { caseId: string }).caseId;

    // Non-supervisor cannot assign initial holder.
    await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/assignments`)
      .set(actorHeaders(analyst1Id, ['analyst']))
      .send({
        holderId: analyst1Id,
        scope: 'analyst',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(403);

    // Supervisor assigns analyst1 and vocal.
    await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/assignments`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        holderId: analyst1Id,
        scope: 'analyst',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(201);

    // Second initial assignment on same scope fails with 409.
    await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/assignments`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        holderId: analyst2Id,
        scope: 'analyst',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/assignments`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        holderId: vocalId,
        scope: 'vocal',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(201);

    // Non-holder analyst2 cannot request reassignment.
    await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/reassignment-requests`)
      .set(actorHeaders(analyst2Id, ['analyst']))
      .send({
        scope: 'analyst',
        reason: 'Intento sin titularidad',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(403);

    // Holder analyst1 requests reassignment.
    const req1 = await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/reassignment-requests`)
      .set(actorHeaders(analyst1Id, ['analyst']))
      .send({
        scope: 'analyst',
        reason: 'Carga operativa',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(201);
    const req1Id = (req1.body as { id: string }).id;

    // Rejection preserves analyst1 as holder.
    await request(app.getHttpServer())
      .post(`/api/v1/reassignment-requests/${req1Id}/decision`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        outcome: 'rejected',
        justification: 'Se mantiene titular vigente',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(200);

    // Request again & test concurrent double decision.
    const req2 = await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/reassignment-requests`)
      .set(actorHeaders(analyst1Id, ['analyst']))
      .send({
        scope: 'analyst',
        reason: 'Segunda solicitud',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(201);
    const req2Id = (req2.body as { id: string }).id;

    const [d1, d2] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/reassignment-requests/${req2Id}/decision`)
        .set(actorHeaders(supervisorId, ['supervisor']))
        .send({
          outcome: 'approved',
          newHolderId: analyst2Id,
          justification: 'Aprobación 1',
          sourceKind: 'test_fixture',
          sourceKey: 'e2e-be011',
        }),
      request(app.getHttpServer())
        .post(`/api/v1/reassignment-requests/${req2Id}/decision`)
        .set(actorHeaders(supervisorId, ['supervisor']))
        .send({
          outcome: 'approved',
          newHolderId: analyst2Id,
          justification: 'Aprobación 2 concurrente',
          sourceKind: 'test_fixture',
          sourceKey: 'e2e-be011',
        }),
    ]);

    const statuses = [d1.status, d2.status].sort();
    expect(statuses).toEqual([200, 409]);

    // Verify exact microsecond timestamp parity between old ended_at, new started_at, decided_at, and audit occurred_at.
    const parity: { exact: boolean }[] = await db.query(
      `SELECT (old_r.ended_at = new_r.started_at
               AND new_r.started_at = rr.decided_at
               AND rr.decided_at = ae.occurred_at) AS exact
       FROM reassignment_request rr
       JOIN responsibility old_r ON old_r.id = rr.expected_responsibility_id
       JOIN responsibility new_r ON new_r.id = rr.successor_responsibility_id
       JOIN audit_event ae ON ae.resource_id = rr.id AND ae.action = 'reassignment:decide' AND ae.kind = 'success'
       WHERE rr.id = $1`,
      [req2Id],
    );
    expect(parity).toEqual([{ exact: true }]);

    // Stale context test: analyst2 creates req3, then DB responsibility changes, decision records stale_attempt and marks requires_treatment.
    const req3 = await request(app.getHttpServer())
      .post(`/api/v1/cases/${caseId}/reassignment-requests`)
      .set(actorHeaders(analyst2Id, ['analyst']))
      .send({
        scope: 'analyst',
        reason: 'Solicitud para probar contexto obsoleto',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(201);
    const req3Id = (req3.body as { id: string }).id;

    // Simulate intermediate responsibility change so req3's expected_responsibility_id becomes stale.
    await db.transaction(async (tx) => {
      const [{ id: oldId, ts }]: { id: string; ts: string }[] = await tx.query(
        `SELECT id, to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS ts
         FROM responsibility WHERE case_id = $1 AND scope = 'analyst' AND ended_at IS NULL`,
        [caseId],
      );
      await tx.query(
        'UPDATE responsibility SET ended_at = $1::timestamptz WHERE id = $2',
        [ts, oldId],
      );
      await tx.query(
        `INSERT INTO responsibility(case_id, scope, holder_id, started_at, recorded_by_id, source_kind, source_key)
         VALUES ($1, 'analyst', $2, $3::timestamptz, $4, 'test_fixture', 'e2e-stale-shift')`,
        [caseId, analyst1Id, ts, supervisorId],
      );
    });

    await request(app.getHttpServer())
      .post(`/api/v1/reassignment-requests/${req3Id}/decision`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        outcome: 'approved',
        newHolderId: analyst1Id,
        justification: 'Debe detectar contexto obsoleto',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(409);

    // Retry while requires_treatment = true is refused with 409.
    await request(app.getHttpServer())
      .post(`/api/v1/reassignment-requests/${req3Id}/decision`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        outcome: 'rejected',
        justification: 'Reintento bloqueado',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(409);

    const staleDetail = await request(app.getHttpServer())
      .get(`/api/v1/reassignment-requests/${req3Id}`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .expect(200);
    expect(staleDetail.body).toMatchObject({
      requiresTreatment: true,
      decisionOutcome: null,
    });
    expect(
      (staleDetail.body as { staleAttempts: unknown[] }).staleAttempts.length,
    ).toBe(1);

    // Treat as superseded -> creates linked request with predecessorId = req3Id.
    const treatRes = await request(app.getHttpServer())
      .post(`/api/v1/reassignment-requests/${req3Id}/treatment`)
      .set(actorHeaders(supervisorId, ['supervisor']))
      .send({
        outcome: 'superseded',
        treatmentNote: 'Sustituida tras cambio intermedio',
        newReason: 'Nueva solicitud vinculada',
        sourceKind: 'test_fixture',
        sourceKey: 'e2e-be011',
      })
      .expect(201);
    expect(treatRes.body).toMatchObject({
      treatedRequestId: req3Id,
      treatmentStatus: 'superseded',
    });
  });
});
