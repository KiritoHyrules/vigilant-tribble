import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, type EntityManager } from 'typeorm';
import { AccessPolicy } from '../../common/security/access-policy';
import type { CurrentActor } from '../../common/security/current-actor';
import { AuditService } from '../audit/audit.service';
import { CASE_SCOPES, type CaseScope } from './cases.constants';
import type {
  CaseListQueryDto,
  IntakeListQueryDto,
} from './dto/case-list-query.dto';
import type {
  CaseDetailResponse,
  CaseListItem,
  CaseListResponse,
  CaseReadinessResponse,
  HolderResponse,
  IncidenceResponse,
  IncorporateCaseResponse,
  InstitutionalDocumentRefResponse,
  IntakeListItem,
  IntakeListResponse,
  ReferenceResponse,
  ResponsibilityHistoryItem,
} from './dto/case-response.dto';
import type { IncorporateCaseDto } from './dto/incorporate-case.dto';
import { assertSourceKindAllowedForEnv, samplePgTimestamp } from './pg-clock';

interface PgErrorShape {
  driverError?: { code?: string; constraint?: string };
  code?: string;
  constraint?: string;
}

function getPgError(error: unknown): { code?: string; constraint?: string } {
  const e = error as PgErrorShape | null;
  return {
    code: e?.driverError?.code ?? e?.code,
    constraint: e?.driverError?.constraint ?? e?.constraint,
  };
}

function computeReadiness(
  classificationCode: 'ordinary' | 'special_route' | null,
  currentHolders: readonly HolderResponse[],
): CaseReadinessResponse {
  const missingScopes = CASE_SCOPES.filter(
    (scope) => !currentHolders.some((holder) => holder.scope === scope),
  );
  return {
    classificationStatus: classificationCode ?? 'missing',
    missingScopes: [...missingScopes],
    ordinaryAnalysisReady:
      classificationCode === 'ordinary' && missingScopes.length === 0,
  };
}

@Injectable()
export class CasesService {
  constructor(
    private readonly database: DataSource,
    private readonly policy: AccessPolicy,
    private readonly audit: AuditService,
  ) {}

  async incorporateCase(
    actor: CurrentActor,
    dto: IncorporateCaseDto,
  ): Promise<IncorporateCaseResponse> {
    await this.policy.assertAllowed({
      actor,
      action: 'case:incorporate',
      resource: { type: 'intake' },
    });
    assertSourceKindAllowedForEnv(dto.sourceKind);

    const docs = dto.institutionalDocuments ?? [];
    const seenDocs = new Set<string>();
    for (const doc of docs) {
      if (Buffer.byteLength(doc.externalReference, 'utf8') > 256) {
        throw new BadRequestException(
          'Institutional document reference exceeds 256 UTF-8 bytes.',
        );
      }
      if (seenDocs.has(doc.externalReference)) {
        throw new BadRequestException(
          'Duplicate institutional document reference in request.',
        );
      }
      seenDocs.add(doc.externalReference);
    }

    const correlationId = randomUUID();
    if (Buffer.byteLength(dto.originalReference, 'utf8') > 256) {
      return this.persistUnresolvedIntake(
        actor,
        dto,
        correlationId,
        'Reference exceeds 256 UTF-8 bytes and is not confirmable in this MVP.',
      );
    }

    try {
      return await this.database.transaction(async (tx) => {
        const spaceRows: { code: string }[] = await tx.query(
          'SELECT code FROM identification_space WHERE code = $1',
          [dto.spaceCode],
        );
        if (spaceRows.length === 0) {
          return this.insertUnresolvedInTx(
            tx,
            actor,
            dto,
            correlationId,
            'Unknown identification space.',
          );
        }

        const occurredAt = await samplePgTimestamp(tx);
        const caseRows: { id: string }[] = await tx.query(
          `INSERT INTO case_record (classification_code, operational_summary, incorporated_at)
           VALUES ($1, $2, $3::timestamptz)
           RETURNING id`,
          [
            dto.classificationCode ?? null,
            dto.operationalSummary ?? null,
            occurredAt,
          ],
        );
        const caseId = caseRows[0].id;

        const refRows: { id: string }[] = await tx.query(
          `INSERT INTO case_reference (
             case_id, space_code, original_reference, is_primary,
             confirmed_by_id, source_kind, source_key, confirmed_at
           ) VALUES ($1, $2, $3, true, $4, $5, $6, $7::timestamptz)
           RETURNING id`,
          [
            caseId,
            dto.spaceCode,
            dto.originalReference,
            actor.id,
            dto.sourceKind,
            dto.sourceKey,
            occurredAt,
          ],
        );
        const referenceId = refRows[0].id;

        const intakeRows: { id: string }[] = await tx.query(
          `INSERT INTO case_intake (
             status, space_code, original_reference, evidence_fingerprint,
             case_id, submitted_by_id, source_kind, source_key, received_at
           ) VALUES ('confirmed', $1, $2, $3, $4, $5, $6, $7, $8::timestamptz)
           RETURNING id`,
          [
            dto.spaceCode,
            dto.originalReference,
            dto.concordanceKey ?? null,
            caseId,
            actor.id,
            dto.sourceKind,
            dto.sourceKey,
            occurredAt,
          ],
        );
        const intakeId = intakeRows[0].id;

        let incidenceId: string | undefined;
        if (!dto.classificationCode) {
          const incRows: { id: string }[] = await tx.query(
            `INSERT INTO case_incidence (
               case_id, intake_id, incidence_kind, summary,
               recorded_by_id, source_kind, source_key, recorded_at
             ) VALUES (
               $1, $2, 'missing_classification',
               'Case incorporated without validated classification; ordinary analysis blocked.',
               $3, $4, $5, $6::timestamptz
             )
             RETURNING id`,
            [
              caseId,
              intakeId,
              actor.id,
              dto.sourceKind,
              dto.sourceKey,
              occurredAt,
            ],
          );
          incidenceId = incRows[0].id;
        }

        for (const doc of docs) {
          await tx.query(
            `INSERT INTO case_institutional_document_ref (
               case_id, space_code, external_reference, document_kind, summary,
               recorded_by_id, source_kind, source_key, received_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)`,
            [
              caseId,
              dto.spaceCode,
              doc.externalReference,
              doc.documentKind,
              doc.summary ?? null,
              actor.id,
              dto.sourceKind,
              dto.sourceKey,
              occurredAt,
            ],
          );
        }

        await this.audit.recordEvent(tx, {
          actorId: actor.id,
          emitterCode: 'case_service',
          dataSourceKind: dto.sourceKind,
          dataSourceKey: dto.sourceKey,
          correlationId,
          action: 'case:incorporate',
          resourceType: 'intake',
          resourceId: intakeId,
          caseId,
          occurredAt,
          kind: 'success',
          resultCode: 'success',
        });

        return {
          outcome: 'confirmed',
          intakeId,
          caseId,
          referenceId,
          ...(incidenceId ? { incidenceId } : {}),
        };
      });
    } catch (error) {
      const pg = getPgError(error);
      if (
        pg.code === '23505' &&
        pg.constraint === 'uq_case_reference_identity'
      ) {
        return this.handleReferenceConflict(actor, dto, correlationId);
      }
      throw error;
    }
  }

  private async persistUnresolvedIntake(
    actor: CurrentActor,
    dto: IncorporateCaseDto,
    correlationId: string,
    reason: string,
  ): Promise<IncorporateCaseResponse> {
    return this.database.transaction((tx) =>
      this.insertUnresolvedInTx(tx, actor, dto, correlationId, reason),
    );
  }

  private async insertUnresolvedInTx(
    tx: EntityManager,
    actor: CurrentActor,
    dto: IncorporateCaseDto,
    correlationId: string,
    reason: string,
  ): Promise<IncorporateCaseResponse> {
    const occurredAt = await samplePgTimestamp(tx);
    const intakeRows: { id: string }[] = await tx.query(
      `INSERT INTO case_intake (
         status, space_code, original_reference, evidence_fingerprint,
         detail, case_id, submitted_by_id, source_kind, source_key, received_at
       ) VALUES ('unresolved', $1, $2, $3, $4, NULL, $5, $6, $7, $8::timestamptz)
       RETURNING id`,
      [
        dto.spaceCode,
        dto.originalReference,
        dto.concordanceKey ?? null,
        reason,
        actor.id,
        dto.sourceKind,
        dto.sourceKey,
        occurredAt,
      ],
    );
    const intakeId = intakeRows[0].id;

    const incRows: { id: string }[] = await tx.query(
      `INSERT INTO case_incidence (
         case_id, intake_id, incidence_kind, summary,
         recorded_by_id, source_kind, source_key, recorded_at
       ) VALUES (NULL, $1, 'unconfirmed_reference', $2, $3, $4, $5, $6::timestamptz)
       RETURNING id`,
      [intakeId, reason, actor.id, dto.sourceKind, dto.sourceKey, occurredAt],
    );

    await this.audit.recordEvent(tx, {
      actorId: actor.id,
      emitterCode: 'case_service',
      dataSourceKind: dto.sourceKind,
      dataSourceKey: dto.sourceKey,
      correlationId,
      action: 'case:incorporate',
      resourceType: 'intake',
      resourceId: intakeId,
      occurredAt,
      kind: 'failure',
      resultCode: 'failure',
    });

    return {
      outcome: 'unresolved',
      intakeId,
      incidenceId: incRows[0].id,
      reason,
    };
  }

  private async handleReferenceConflict(
    actor: CurrentActor,
    dto: IncorporateCaseDto,
    correlationId: string,
  ): Promise<never> {
    const outcome = await this.database.transaction(async (tx) => {
      const existingRows: {
        classification_code: 'ordinary' | 'special_route' | null;
        evidence_fingerprint: string | null;
      }[] = await tx.query(
        `SELECT c.classification_code,
                (SELECT ci.evidence_fingerprint
                 FROM case_intake ci
                 WHERE ci.case_id = cr.case_id AND ci.status = 'confirmed'
                 ORDER BY ci.received_at DESC, ci.id DESC
                 LIMIT 1) AS evidence_fingerprint
         FROM case_reference cr
         JOIN case_record c ON c.id = cr.case_id
         WHERE cr.space_code = $1 AND cr.match_key = btrim($2, ' ')`,
        [dto.spaceCode, dto.originalReference],
      );

      const winner = existingRows[0];
      const classificationDiffers =
        winner !== undefined &&
        (winner.classification_code ?? null) !==
          (dto.classificationCode ?? null);
      const fingerprintDiffers =
        winner !== undefined &&
        dto.concordanceKey !== undefined &&
        winner.evidence_fingerprint !== null &&
        dto.concordanceKey !== winner.evidence_fingerprint;
      const isCollision = classificationDiffers || fingerprintDiffers;
      const status = isCollision ? 'collision' : 'duplicate';
      const detail = isCollision
        ? 'Contradictory evidence detected against confirmed reference.'
        : 'Concordant duplicate reference detected against confirmed case.';

      const occurredAt = await samplePgTimestamp(tx);
      const intakeRows: { id: string }[] = await tx.query(
        `INSERT INTO case_intake (
           status, space_code, original_reference, evidence_fingerprint,
           detail, case_id, submitted_by_id, source_kind, source_key, received_at
         ) VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9::timestamptz)
         RETURNING id`,
        [
          status,
          dto.spaceCode,
          dto.originalReference,
          dto.concordanceKey ?? null,
          detail,
          actor.id,
          dto.sourceKind,
          dto.sourceKey,
          occurredAt,
        ],
      );
      const intakeId = intakeRows[0].id;

      if (isCollision) {
        await tx.query(
          `INSERT INTO case_incidence (
             case_id, intake_id, incidence_kind, summary,
             recorded_by_id, source_kind, source_key, recorded_at
           ) VALUES (NULL, $1, 'reference_collision', $2, $3, $4, $5, $6::timestamptz)`,
          [
            intakeId,
            detail,
            actor.id,
            dto.sourceKind,
            dto.sourceKey,
            occurredAt,
          ],
        );
      }

      await this.audit.recordEvent(tx, {
        actorId: actor.id,
        emitterCode: 'case_service',
        dataSourceKind: dto.sourceKind,
        dataSourceKey: dto.sourceKey,
        correlationId,
        action: 'case:incorporate',
        resourceType: 'intake',
        resourceId: intakeId,
        occurredAt,
        kind: 'failure',
        resultCode: 'failure',
      });

      return { isCollision, intakeId };
    });

    throw new ConflictException({
      message: outcome.isCollision
        ? 'Reference collision recorded in intake.'
        : 'Duplicate reference already confirmed.',
      code: outcome.isCollision ? 'REFERENCE_COLLISION' : 'DUPLICATE_REFERENCE',
      intakeId: outcome.intakeId,
    });
  }

  async listCases(
    actor: CurrentActor,
    query: CaseListQueryDto,
  ): Promise<CaseListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return this.audit.mandatoryRead(
      {
        actorId: actor.id,
        emitterCode: 'case_service',
        correlationId: randomUUID(),
        action: 'case:read',
        resourceType: 'case',
        occurredAt: new Date(),
      },
      async (tx) => {
        await this.policy.assertAllowed({
          actor,
          action: 'case:read',
          resource: { type: 'case' },
        });

        const conditions: string[] = [];
        const params: unknown[] = [];
        const pushParam = (val: unknown): string => {
          params.push(val);
          return `$${params.length}`;
        };

        if (!actor.roles.includes('supervisor')) {
          const p = pushParam(actor.id);
          conditions.push(
            `EXISTS (SELECT 1 FROM responsibility sr WHERE sr.case_id = c.id AND sr.holder_id = ${p} AND sr.ended_at IS NULL)`,
          );
        }

        if (query.spaceCode !== undefined) {
          const p = pushParam(query.spaceCode);
          conditions.push(
            `EXISTS (SELECT 1 FROM case_reference sp WHERE sp.case_id = c.id AND sp.space_code = ${p})`,
          );
        }

        if (query.reference !== undefined && query.reference !== '') {
          const p = pushParam(query.reference);
          conditions.push(
            `EXISTS (SELECT 1 FROM case_reference rf WHERE rf.case_id = c.id AND strpos(rf.match_key, btrim(${p}, ' ')) > 0)`,
          );
        }

        if (query.holderId !== undefined) {
          const p = pushParam(query.holderId);
          conditions.push(
            `EXISTS (SELECT 1 FROM responsibility hr WHERE hr.case_id = c.id AND hr.holder_id = ${p} AND hr.ended_at IS NULL)`,
          );
        }

        if (query.unassigned === true) {
          conditions.push(
            `(SELECT COUNT(*) FROM responsibility ur WHERE ur.case_id = c.id AND ur.ended_at IS NULL) < 2`,
          );
        } else if (query.unassigned === false) {
          conditions.push(
            `(SELECT COUNT(*) FROM responsibility ur WHERE ur.case_id = c.id AND ur.ended_at IS NULL) = 2`,
          );
        }

        if (query.classificationCode === 'unclassified') {
          conditions.push(`c.classification_code IS NULL`);
        } else if (query.classificationCode !== undefined) {
          const p = pushParam(query.classificationCode);
          conditions.push(`c.classification_code = ${p}`);
        }

        const whereSql =
          conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countRows: { total: string }[] = await tx.query(
          `SELECT COUNT(*)::text AS total FROM case_record c ${whereSql}`,
          [...params],
        );
        const total = Number(countRows[0]?.total ?? 0);

        const offset = (page - 1) * limit;
        const limitParam = pushParam(limit);
        const offsetParam = pushParam(offset);

        const caseRows: {
          id: string;
          classification_code: 'ordinary' | 'special_route' | null;
          operational_summary: string | null;
          incorporated_at: Date;
          updated_at: Date;
        }[] = await tx.query(
          `SELECT c.id, c.classification_code, c.operational_summary, c.incorporated_at,
                  GREATEST(
                    c.incorporated_at,
                    COALESCE((SELECT MAX(GREATEST(r.started_at, COALESCE(r.ended_at, r.started_at)))
                              FROM responsibility r WHERE r.case_id = c.id), c.incorporated_at)
                  ) AS updated_at
           FROM case_record c
           ${whereSql}
           ORDER BY c.incorporated_at DESC, c.id DESC
           LIMIT ${limitParam} OFFSET ${offsetParam}`,
          params,
        );

        const data = await this.hydrateListItems(tx, caseRows);
        return { data: { data, total, page, limit } };
      },
    );
  }

  private async hydrateListItems(
    tx: EntityManager,
    caseRows: {
      id: string;
      classification_code: 'ordinary' | 'special_route' | null;
      operational_summary: string | null;
      incorporated_at: Date;
      updated_at: Date;
    }[],
  ): Promise<CaseListItem[]> {
    if (caseRows.length === 0) return [];
    const caseIds = caseRows.map((row) => row.id);

    const primaryRefs: {
      id: string;
      case_id: string;
      space_code: string;
      original_reference: string;
      is_primary: boolean;
      confirmed_at: Date;
    }[] = await tx.query(
      `SELECT id, case_id, space_code, original_reference, is_primary, confirmed_at
       FROM case_reference
       WHERE case_id = ANY($1::uuid[]) AND is_primary = true`,
      [caseIds],
    );

    const holders: {
      case_id: string;
      participant_id: string;
      display_name: string;
      scope: CaseScope;
      started_at: Date;
    }[] = await tx.query(
      `SELECT r.case_id, r.holder_id AS participant_id, p.display_name, r.scope, r.started_at
       FROM responsibility r
       JOIN participant p ON p.id = r.holder_id
       WHERE r.case_id = ANY($1::uuid[]) AND r.ended_at IS NULL
       ORDER BY r.scope ASC`,
      [caseIds],
    );

    const refByCase = new Map<string, ReferenceResponse>();
    for (const ref of primaryRefs) {
      refByCase.set(ref.case_id, {
        id: ref.id,
        spaceCode: ref.space_code,
        originalReference: ref.original_reference,
        isPrimary: ref.is_primary,
        confirmedAt: new Date(ref.confirmed_at).toISOString(),
      });
    }

    const holdersByCase = new Map<string, HolderResponse[]>();
    for (const holder of holders) {
      const list = holdersByCase.get(holder.case_id) ?? [];
      list.push({
        participantId: holder.participant_id,
        displayName: holder.display_name,
        scope: holder.scope,
        startedAt: new Date(holder.started_at).toISOString(),
      });
      holdersByCase.set(holder.case_id, list);
    }

    return caseRows.map((row) => {
      const currentHolders = holdersByCase.get(row.id) ?? [];
      return {
        id: row.id,
        classificationCode: row.classification_code,
        operationalSummary: row.operational_summary,
        incorporatedAt: new Date(row.incorporated_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        primaryReference: refByCase.get(row.id),
        currentHolders,
        readiness: computeReadiness(row.classification_code, currentHolders),
      };
    });
  }

  async getCaseDetail(
    actor: CurrentActor,
    caseId: string,
  ): Promise<CaseDetailResponse> {
    return this.audit.mandatoryRead(
      {
        actorId: actor.id,
        emitterCode: 'case_service',
        correlationId: randomUUID(),
        action: 'case:read',
        resourceType: 'case',
        resourceId: caseId,
        caseId,
        occurredAt: new Date(),
      },
      async (tx) => {
        const capabilityAllowed = await this.policy.isAllowed({
          actor,
          action: 'case:read',
          resource: { type: 'case' },
        });
        if (capabilityAllowed !== true) {
          throw new ForbiddenException();
        }

        const resourceAllowed = await this.policy.isAllowed({
          actor,
          action: 'case:read',
          resource: { type: 'case', id: caseId },
        });
        if (resourceAllowed !== true) {
          throw new NotFoundException('Case not found.');
        }

        const params: unknown[] = [caseId];
        let scopeSql = '';
        if (!actor.roles.includes('supervisor')) {
          params.push(actor.id);
          scopeSql = `AND EXISTS (
            SELECT 1 FROM responsibility sr
            WHERE sr.case_id = c.id AND sr.holder_id = $2 AND sr.ended_at IS NULL
          )`;
        }

        const caseRows: {
          id: string;
          classification_code: 'ordinary' | 'special_route' | null;
          operational_summary: string | null;
          incorporated_at: Date;
          updated_at: Date;
        }[] = await tx.query(
          `SELECT c.id, c.classification_code, c.operational_summary, c.incorporated_at,
                  GREATEST(
                    c.incorporated_at,
                    COALESCE((SELECT MAX(GREATEST(r.started_at, COALESCE(r.ended_at, r.started_at)))
                              FROM responsibility r WHERE r.case_id = c.id), c.incorporated_at)
                  ) AS updated_at
           FROM case_record c
           WHERE c.id = $1 ${scopeSql}`,
          params,
        );

        const caseRow = caseRows[0];
        if (!caseRow) {
          throw new NotFoundException('Case not found.');
        }

        const refRows: {
          id: string;
          space_code: string;
          original_reference: string;
          is_primary: boolean;
          confirmed_at: Date;
        }[] = await tx.query(
          `SELECT id, space_code, original_reference, is_primary, confirmed_at
           FROM case_reference
           WHERE case_id = $1
           ORDER BY is_primary DESC, confirmed_at ASC, id ASC`,
          [caseId],
        );

        const historyRows: {
          id: string;
          scope: CaseScope;
          holder_id: string;
          holder_name: string;
          started_at: Date;
          ended_at: Date | null;
        }[] = await tx.query(
          `SELECT r.id, r.scope, r.holder_id, p.display_name AS holder_name, r.started_at, r.ended_at
           FROM responsibility r
           JOIN participant p ON p.id = r.holder_id
           WHERE r.case_id = $1
           ORDER BY r.started_at DESC, r.id DESC`,
          [caseId],
        );

        const incidenceRows: {
          id: string;
          incidence_kind: string;
          summary: string;
          status: 'open' | 'resolved';
          recorded_at: Date;
          resolved_at: Date | null;
          resolution_note: string | null;
        }[] = await tx.query(
          `SELECT id, incidence_kind, summary, status, recorded_at, resolved_at, resolution_note
           FROM case_incidence
           WHERE case_id = $1
           ORDER BY recorded_at DESC, id DESC`,
          [caseId],
        );

        const docRefRows: {
          id: string;
          space_code: string;
          external_reference: string;
          document_kind: string;
          summary: string | null;
          received_at: Date;
        }[] = await tx.query(
          `SELECT id, space_code, external_reference, document_kind, summary, received_at
           FROM case_institutional_document_ref
           WHERE case_id = $1
           ORDER BY received_at DESC, id DESC`,
          [caseId],
        );

        const references: ReferenceResponse[] = refRows.map((r) => ({
          id: r.id,
          spaceCode: r.space_code,
          originalReference: r.original_reference,
          isPrimary: r.is_primary,
          confirmedAt: new Date(r.confirmed_at).toISOString(),
        }));

        const responsibilityHistory: ResponsibilityHistoryItem[] =
          historyRows.map((h) => ({
            id: h.id,
            scope: h.scope,
            holderId: h.holder_id,
            holderName: h.holder_name,
            startedAt: new Date(h.started_at).toISOString(),
            endedAt: h.ended_at ? new Date(h.ended_at).toISOString() : null,
          }));

        const currentHolders: HolderResponse[] = historyRows
          .filter((h) => h.ended_at === null)
          .map((h) => ({
            participantId: h.holder_id,
            displayName: h.holder_name,
            scope: h.scope,
            startedAt: new Date(h.started_at).toISOString(),
          }));

        const incidences: IncidenceResponse[] = incidenceRows.map((i) => ({
          id: i.id,
          incidenceKind: i.incidence_kind,
          summary: i.summary,
          status: i.status,
          recordedAt: new Date(i.recorded_at).toISOString(),
          resolvedAt: i.resolved_at
            ? new Date(i.resolved_at).toISOString()
            : null,
          resolutionNote: i.resolution_note,
        }));

        const institutionalDocuments: InstitutionalDocumentRefResponse[] =
          docRefRows.map((d) => ({
            id: d.id,
            spaceCode: d.space_code,
            externalReference: d.external_reference,
            documentKind: d.document_kind,
            summary: d.summary,
            receivedAt: new Date(d.received_at).toISOString(),
          }));

        return {
          data: {
            id: caseRow.id,
            classificationCode: caseRow.classification_code,
            operationalSummary: caseRow.operational_summary,
            incorporatedAt: new Date(caseRow.incorporated_at).toISOString(),
            updatedAt: new Date(caseRow.updated_at).toISOString(),
            primaryReference: references.find((r) => r.isPrimary),
            currentHolders,
            readiness: computeReadiness(
              caseRow.classification_code,
              currentHolders,
            ),
            references,
            responsibilityHistory,
            incidences,
            institutionalDocuments,
          },
        };
      },
    );
  }

  async listIntake(
    actor: CurrentActor,
    query: IntakeListQueryDto,
  ): Promise<IntakeListResponse> {
    await this.policy.assertAllowed({
      actor,
      action: 'case:incorporate',
      resource: { type: 'intake' },
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const conditions: string[] = [];
    const params: unknown[] = [];
    const pushParam = (val: unknown): string => {
      params.push(val);
      return `$${params.length}`;
    };

    if (!actor.roles.includes('supervisor')) {
      const p = pushParam(actor.id);
      conditions.push(`submitted_by_id = ${p}`);
    }
    if (query.status !== undefined) {
      const p = pushParam(query.status);
      conditions.push(`status = ${p}`);
    }

    const whereSql =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRows: { total: string }[] = await this.database.query(
      `SELECT COUNT(*)::text AS total FROM case_intake ${whereSql}`,
      [...params],
    );
    const total = Number(countRows[0]?.total ?? 0);

    const offset = (page - 1) * limit;
    const limitParam = pushParam(limit);
    const offsetParam = pushParam(offset);

    const rows: {
      id: string;
      status: 'confirmed' | 'duplicate' | 'collision' | 'unresolved';
      space_code: string;
      original_reference: string;
      detail: string | null;
      case_id: string | null;
      received_at: Date;
    }[] = await this.database.query(
      `SELECT id, status, space_code, original_reference, detail, case_id, received_at
       FROM case_intake
       ${whereSql}
       ORDER BY received_at DESC, id DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params,
    );

    const data: IntakeListItem[] = rows.map((row) => ({
      id: row.id,
      status: row.status,
      spaceCode: row.space_code,
      originalReference: row.original_reference,
      detail: row.detail,
      caseId: row.case_id,
      receivedAt: new Date(row.received_at).toISOString(),
    }));

    return { data, total, page, limit };
  }
}
