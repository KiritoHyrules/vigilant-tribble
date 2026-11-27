# Cases and assignments contract v1

**BE-003 / I3 · Draft for cross-review (I1, I2, I5).** This contract defines
the incorporation, authorized consultation, assignment, and reassignment
operations for the `cases` module, fulfilling BE-003 and serving as the
implementation boundary for BE-007b and BE-011.

> Note on private sources: the external academic report containing detailed
> wording of RF-001–007, RF-025, UC-01–04, and RN-D/RN-P is not committed to
> this repository. Confirmed rules come from
> [data-foundation-v1.md](data-foundation-v1.md),
> [audit-exchange-operations-v1.md](audit-exchange-operations-v1.md), and the
> observed frontend screens. Unverified institutional taxonomies or normative
> rules are explicitly marked as deferred rather than invented.

## Scope

| Card | Scope | Dependencies |
|---|---|---|
| BE-003 | Contract, frontend mapping, schema/permission/audit handoffs, test matrix | BE-001 (Done), BE-002 (Done) |
| BE-007b | Case incorporation, unresolved intake, duplicate/collision detection, incidences, institutional document references, authorized case list/detail | G1 (Done), BE-006 (Done), BE-008 (Done), I2 `AccessPolicy` |
| BE-011 | Initial assignment, motivated reassignment request, transactional decision, stale context detection & treatment | BE-007b, BE-008 (Done) |

## Binding decisions aligned with G1

| ID | Rule |
|---|---|
| DEC-CASE-001 | Case incorporation creates `case_record`, primary `case_reference`, `case_intake(confirmed)`, optional initial `case_institutional_document_ref` rows, and an automatic `case_incidence(missing_classification)` if `classificationCode` is null — all inside one transaction with `AuditService.recordEvent`. |
| DEC-CASE-002 | Unconfirmable references (`> 256` UTF-8 bytes or unknown `identification_space`) never truncate and never create a placeholder `case_record` (DEC-DATA-010). They persist intact in `case_intake(unresolved)` with a `case_incidence(unconfirmed_reference)` and `failure` audit evidence. |
| DEC-CASE-003 | A `case_reference` unique conflict (`23505` on `(space_code, match_key)`) rolls back the provisional case transaction. A subsequent transaction reads the winning reference, checks concordance (`classificationCode` + optional `concordanceKey`), persists `case_intake` (`duplicate` if concordant, `collision` + `case_incidence(reference_collision)` if contradictory) with `case_id = null` and `failure` audit evidence, then returns `409 Conflict` without disclosing the winning `caseId`. |
| DEC-CASE-004 | `match_key` comparison uses PostgreSQL `btrim(original_reference, ' ')` under `COLLATE "C"`. Input bytes are preserved verbatim without `.trim()`, case folding, Unicode normalization, or separator edits. Control characters and blank keys return `400`. |
| DEC-CASE-005 | List/search (`GET /api/v1/cases`) authorizes capability first, filters by actor scope (`supervisor` vs current `responsibility` holder) **before** `COUNT(*)` and pagination, and sorts deterministically (`incorporated_at DESC, id DESC`). Detail (`GET /api/v1/cases/:id`) returns indistinguishable `404` for nonexistent and out-of-scope cases, and runs inside `AuditService.mandatoryRead` so audit failure returns `503` without releasing case data. |
| DEC-CASE-006 | Initial assignment (`case:assign`) applies directly by an authorized `supervisor` only when no active holder exists for that `scope` (`analyst` | `vocal`). Reassignment follows request → decision. |
| DEC-CASE-007 | Reassignment request (`reassignment:request`) may only be submitted by the active holder of `(caseId, scope)` when no open (`decision_outcome IS NULL AND treatment_status IS NULL`) request exists for that `(caseId, scope)`. |
| DEC-CASE-008 | Reassignment decision (`reassignment:decide`) locks `case_record` first (`FOR UPDATE`), then `reassignment_request`. After locking, it checks active `responsibility` and samples `clock_timestamp()` in PostgreSQL with microsecond precision (lossless UTC string, never JS `Date` round-trip). Stale context marks `requires_treatment = true`, inserts `reassignment_stale_attempt`, emits `failure/stale_context` audit evidence, commits, and then throws `409`. Retries while `requires_treatment = true` fail with `409`. |
| DEC-CASE-009 | Approved decisions close the prior `responsibility` (`ended_at = occurredAt`), create the successor (`started_at = occurredAt`), verify `occurredAt > old.startedAt`, and record `decided_at = occurredAt` and audit `occurred_at = occurredAt`. Rejections leave `responsibility` untouched. |
| DEC-CASE-010 | Treatment of a `requires_treatment` request leaves `expected_responsibility_id` immutable and never reinterprets a stale attempt as a rejection. `superseded` closes treatment and creates a linked `reassignment_request` (`predecessor_id`) in one transaction audited via `reassignment:request`. `ineligible` (without a new request) stays disabled (`501`) until I1/I5 register `reassignment:treat` in `AuditService` (AJ-06). |

## API Contract (candidate routes under `/api/v1`)

| Method & Route | Operation | Action / Resource | Actor Rule | Status Codes |
|---|---|---|---|---|
| `POST /api/v1/cases/incorporate` | Incorporate case or persist unresolved intake | `case:incorporate` / `intake` | `AccessPolicy` | `201` (confirmed), `202` (unresolved), `400`, `401`, `403`, `409` (duplicate/collision), `503` |
| `GET /api/v1/cases` | List/search authorized cases | `case:read` / `case` | `AccessPolicy` + scope filter (`supervisor` or active holder) | `200`, `400`, `401`, `403`, `503` |
| `GET /api/v1/cases/intake` | List authorized intake records | `case:incorporate` / `intake` | `AccessPolicy` (`supervisor` or own submissions) | `200`, `401`, `403` |
| `GET /api/v1/cases/:id` | Authorized case detail (with references, holders, history, incidences, inst. doc refs) | `case:read` / `case` (`id`) | `AccessPolicy` + scope filter | `200`, `400`, `401`, `403`, `404`, `503` |
| `POST /api/v1/cases/:id/assignments` | Initial assignment for `analyst` or `vocal` | `case:assign` / `case` (`id`) | `AccessPolicy` + `supervisor` role | `201`, `400`, `401`, `403`, `404`, `409`, `503` |
| `GET /api/v1/reassignment-requests` | List reassignment requests in scope | `case:read` / `case` | `AccessPolicy` + `supervisor` or requester/holder | `200`, `401`, `403` |
| `GET /api/v1/reassignment-requests/:id` | Detail of reassignment request + stale attempts | `case:read` / `case` | `AccessPolicy` + `supervisor` or requester/holder | `200`, `401`, `403`, `404` |
| `POST /api/v1/cases/:id/reassignment-requests` | Request reassignment for active scope | `reassignment:request` / `reassignment_request` | `AccessPolicy` + active holder of `(caseId, scope)` | `201`, `400`, `401`, `403`, `404`, `409`, `503` |
| `POST /api/v1/reassignment-requests/:id/decision` | Approve or reject pending reassignment request | `reassignment:decide` / `reassignment_request` (`id`) | `AccessPolicy` + `supervisor` role | `200`, `400`, `401`, `403`, `404`, `409`, `503` |
| `POST /api/v1/reassignment-requests/:id/treatment` | Treat a `requires_treatment` request (`superseded` active; `ineligible` pending `AuditService`) | `reassignment:treat` / `reassignment_request` (`id`) | `AccessPolicy` + `supervisor` role | `201`, `400`, `401`, `403`, `404`, `409`, `501`, `503` |

## Frontend source mapping (verified files)

| Frontend artifact | Domain mapping | Notes |
|---|---|---|
| `frontend/src/data/expedients.ts` | `Expedient` → `case_record` + primary `case_reference` + `responsibility` + `participant` | `type`, `action`, `status` are UI work-card labels, not stored `classification_code`. |
| `frontend/src/data/reassignment.ts` | `ReassignmentRequest` → `reassignment_request` | Maps `Pendiente de evaluación` (`decision_outcome IS NULL`), `Aprobada`, `Rechazada`. |
| `frontend/src/types/navigation.ts` | `Actor` → `role.code` (`analyst`, `supervisor`, `reviewer`, `vocal`, `exchange`, `support`, `auditor`) | UI labels only; server enforces roles/grants. |
| `frontend/src/views/PendingView.tsx` | `GET /api/v1/cases` scoped to active holder / supervisor | Derived operational readiness (`missingClassification`, `missingScopes`). |
| `frontend/src/views/LocateView.tsx` | `GET /api/v1/cases?reference=...` | Authorization precedes count and pagination; `unassigned` maps to missing holder filter. |
| `frontend/src/views/ExpedientDetail.tsx` | `GET /api/v1/cases/:id` | Shows `operationalSummary`, current holders, assignment history, institutional doc refs, incidences. |
| `frontend/src/views/InitialAssignmentView.tsx` | `POST /api/v1/cases/:id/assignments` | Supervisor only; rejected (`409`) if scope already has holder. |
| `frontend/src/views/ReassignmentRequestView.tsx` | `POST /api/v1/cases/:id/reassignment-requests` | Active holder only; blocked (`409`) if an open request exists. |
| `frontend/src/views/ReassignmentQueue.tsx` | `GET /api/v1/reassignment-requests` | Supervisor evaluation queue. |
| `frontend/src/views/ReassignmentEvaluation.tsx` | `GET /api/v1/reassignment-requests/:id` + `POST .../decision` | Approve requires `newHolderId` + `justification`; reject preserves current holder. |
| `frontend/src/views/TrackingPanel.tsx` & `frontend/src/App.tsx` | Operational history derived from persisted assignment/request timestamps | `updated` derives from actual known events; no fabricated dates. |

## Handoffs

### To I1 (Schema & migrations)

Two incremental migrations follow `1795824000000-AuditEvidence.ts` (timestamps subject to I1 integration sequence):

1. `1795880000000-CasesIntakeAndIncidences.ts` (BE-007b): `case_intake`, `case_incidence`, `case_institutional_document_ref`.
2. `1795920000000-ReassignmentRequests.ts` (BE-011): `reassignment_request`, `reassignment_stale_attempt`.

Also flagged for I1: `backend/test/audit.e2e-spec.ts` asserts exact 9-table equality (`toEqual(names)`); adding these 5 tables requires updating that assertion when I1 integrates these migrations into `main`.

### To I2 (Authorization & `CurrentActor`)

Compatible with `CurrentActor` (`{ id, roles }`), `AccessRequest`, and `AccessPolicy`.
Actions used: `case:incorporate`, `case:read`, `case:assign`, `reassignment:request`, `reassignment:decide`, and candidate `reassignment:treat`.
Pending BE-007a: real session resolution (`AuthenticatedGuard`), non-denying `AccessPolicy`, and confirmation of whether non-supervisor roles (e.g., `reviewer`, `exchange`) receive scoped `case:read` access.

### To I5 (Audit)

Existing `AuditService` vocabulary covers `case:incorporate` (`intake`), `case:read` (`case`), `case:assign` (`case`), `reassignment:request` (`reassignment_request`), and `reassignment:decide` (`reassignment_request`, including `resultCode: 'stale_context'` and `beforeData`/`afterData` `{ holderId, scope }`).
Proposed additions to `AuditService` for future follow-up (currently disabled/not emitted directly without I1/I5 approval):
- `reassignment:treat` → `reassignment_request` (to support `ineligible` treatment without a successor request)
- `case:incidence` → `case` / `intake` (for standalone incidence creation/resolution outside `case:incorporate`)
- `case:classify` → `case` (for standalone classification updates)

## Test scenarios (specified & implemented in unit + e2e specs)

1. Unauthenticated `401` and provisional `DenyAllAccessPolicy` `403` across all case/assignment endpoints.
2. Incorporation happy path (atomic `case_record` + primary `case_reference` + `case_intake` + `audit_event`, and `missing_classification` incidence when `classificationCode` is null).
3. Incorporation rollback on forced audit failure (`503`, zero persisted case/reference/intake rows).
4. Duplicate (`409 DUPLICATE_REFERENCE`) vs contradictory collision (`409 REFERENCE_COLLISION` + `case_incidence`), preserving winning case without disclosure.
5. Unconfirmable reference (`> 256` UTF-8 bytes or unknown `space_code`) persisted intact in `case_intake(unresolved)` with `case_id = null` and `202`.
6. Scoped query: non-supervisor cannot discover another holder's case via list search (`total = 0`) or detail (`404` indistinguishable from missing UUID).
7. Mandatory read audit failure (`503`) prevents releasing case detail.
8. Initial assignment happy path (`supervisor` assigns `analyst` / `vocal`), non-supervisor denial (`403`), non-holder-role target rejection (`400`), and duplicate initial assignment rejection (`409`).
9. Reassignment request by active holder, denial for non-holder (`403`), duplicate open request rejection (`409`).
10. Reassignment rejection preserves active holder and audit trail.
11. Reassignment approval closes old `responsibility` and creates successor with identical microsecond PostgreSQL timestamp (`ended_at = started_at = decided_at = audit.occurred_at`).
12. Concurrent double decision on the same request: one succeeds, the second rejects (`409`), holder changes only once.
13. Stale context detection (`requires_treatment = true`, `reassignment_stale_attempt` committed, `audit_event` with `stale_context` committed, `409` returned, retry refused with `409`, `superseded` treatment creates linked request via `predecessor_id`).

## Open blocks / deferred

- Standalone classification mutation (`PATCH /cases/:id/classification`), standalone incidence creation/resolution, and `ineligible` treatment without replacement request remain disabled until I1/I5 approve extending `AuditService` action allowlists (`AJ-06`).
- Normative taxonomies for `classification_code` and `identification_space` seed values await confirmation from the private academic specification / I1.
- Full end-to-end execution against real PostgreSQL 17 and Node 24 LTS is required in CI / local Docker environment.
