# Audit, exchange and operations contract

**BE-005 · proposed for cross-review by I2 and schema approval by I1.** This contract extends the [data foundation](data-foundation-v1.md) without changing its seven tables. It defines the handoff to BE-008 (audit), BE-012 (exchange) and BE-014 (maintenance). It does not add HTTP routes, confer permissions, or claim that any of these features are implemented.

## Audit boundary for G2

| Term | Meaning |
|---|---|
| Audit event | An append-only record of an attributable operation or consultation; not the source of business state. |
| Attribution | Participant who acted, server component that emitted the event, and verified source of the data are separate facts. Any of them must not stand in for another. |
| Correlation | An identifier linking related events across an operation or attempts; not an idempotency key. |
| Mandatory audit | Evidence that must commit before reporting a successful mutation or releasing protected data from a covered read. |

### Producer interface

`recordEvent(tx: EntityManager, event: AuditEventInput): Promise<AuditEventId>` uses the caller's active transaction manager. It refuses an inactive or unbound manager and never opens an independent transaction for success. The returned ID is provisional until the caller commits. Access is checked against the exact operation and resource; an event is not proof of authorization by itself.

| Input | Source and rule |
|---|---|
| `actorId`, `emitterCode` | Authenticated participant UUID from `CurrentActor.id` when available, never account/session ID or a client field. A controlled server emitter is mandatory. An unauthenticated rejection or attributable technical action may have no participant; never create a placeholder. |
| `dataSourceKind`, `dataSourceKey` | Optional pair, both or neither; take only verified, configured provenance from the owning service. May coexist with an actor. |
| `correlationId`, `action`, `resourceType`, `resourceId` | Server-bound UUID correlation and registered operation/resource pair; UUID of the exact resource when resolved. Unknown combinations deny or fail validation. A denial must not look up or disclose protected facts solely to fill metadata. |
| `caseId`, `scopeKey` | Server-resolved case UUID when known for a case-bound event; no case for genuinely global or unresolved events. The owning service validates case/resource agreement and scope; scope is never a grant submitted by the client. |
| `occurredAt`, `kind`, `resultCode` | Time of fact, kind (`success`, `failure`, `denied`, `read`, `correction`) and separately controlled result. Preserve PostgreSQL precision when the producing operation shares an effective timestamp. The store sets `recordedAt`. |
| `beforeData`, `afterData` | Optional allowlisted fields per operation, e.g. holder UUID and responsibility scope before/after reassignment. Reject unsupported keys; do not serialize entities, bodies, headers, queries, exception text, documents, passwords, cookies, tokens or secrets. |
| `consultedEventIds`, `correctsId` | For RF-023 evidence consultation, record exactly the audit event IDs disclosed, possibly none; not the entire filtered dataset. A correction links its existing antecedent, preserves the original and records only the approved changed facts. |

### Consumer handoff

| Owner | Boundary to implement and verify |
|---|---|
| I2 / BE-007a | Supply server-derived identity and roles, and resource-aware policy. Incorrect credentials, expired or revoked sessions return `401`. No credentials or session material in evidence. Agree who may read audit evidence and which operations require mandatory logging; do not inherit permissions from demo views. |
| I3 / BE-007b | Search by institutional reference with authorization **before** pagination and counts. Detail by internal UUID; out of scope and nonexistent return indistinguishable `404`. Pass exact authorized resource and known case to audit. No protected data on an audit failure (`503` for mandatory audit unavailability). |
| BE-008 | Provide the transaction-bound writer and authorized evidence read. For mandatory reads, select/authorize the response, append the event and any consulted references, then commit **before** returning data. Do not log the internal evidence write recursively. |

If a mutation fails or rolls back, write no success event. When policy requires failure/denial evidence, record it separately after the failed transaction, using only known authorized facts. If that write fails, do not claim the evidence was recorded. Mandatory audit unavailability is a sanitized `503`; an unexpected implementation error remains generic `500`. The error response never contains protected data. For `audit:read`, authorize the requested resource/scope and filter visibility before paging; a denial releases neither events nor counts. No exact visibility grants, route names or request DTOs are assigned by this document.

## Proposed BE-008 physical increment

Review these two relations before migration; no changes to the BE-006 schema. Use centrally sequenced PostgreSQL migrations with restrictive foreign keys and no synchronization.

| Relation | Proposed columns and integrity |
|---|---|
| `audit_event` | `id uuid` PK with v4 default; `correlation_id uuid` required; nullable `actor_id uuid` FK to `participant`; required `emitter_code text`; nullable paired `data_source_kind` / `data_source_key text`; required `action`, `resource_type` and `result_code text`; nullable `resource_id uuid`, `case_id uuid` FK to `case_record`, `scope_key text`; required `occurred_at` / `recorded_at timestamptz`; required `kind text` with allowed-values check; nullable `before_data` / `after_data jsonb` limited to objects validated against the producer's allowlist; nullable `corrects_id uuid` self-FK, present only for corrections and never self-referential. |
| `audit_event_read_ref` | `(event_id uuid, consulted_event_id uuid)` composite PK and two restrictive FKs to `audit_event`; no self-reference. The service verifies the parent is a read event and stores only IDs from the released page, in the same transaction as the read event. |

`case_id` preserves the enforceable case link; the polymorphic resource descriptor is not a foreign key. The join relation supports several consulted events per read without a JSON list or an overwritten record. Propose indexes for `(case_id, occurred_at, id)`, `(resource_type, resource_id, occurred_at, id)`, `correlation_id`, and reverse lookup on `consulted_event_id`. Require scoped runtime reads and insert-only audit writes; the deployment/retention policy for privileged access, retention and restore remains to be approved, not promised by this schema.

## Exchange and maintenance boundaries

**Exchange — UC-09–11, RF-016–019.** An exchange refers to the exact action/version and intended destination. An attempt is one dispatch with its own ID, time and result; it is not an exchange or an acknowledgement. Local persistence does not confirm delivery. Candidate simulator port: `dispatch(command)` receives an operation ID, attempt ID, stable idempotency key, exact target and version identifiers; returns `confirmed` with a synthetic confirmation reference, `timeout` with unknown outcome, or `error` with a sanitized classification. It calls no institutional API. Local attempt writes bracket the simulated dispatch; do not hold a database transaction across external I/O in later adapters. A legitimate retry keeps the same logical key, creates a new attempt, and does not erase prior evidence. A changed payload cannot silently reuse the same key. An unknown outcome remains unconfirmed and requires authorized treatment before another dispatch. Key namespace/lifetime, reconciliation and retry limits remain BE-012 decisions; no automatic retry or legal consequence is introduced. A special-route record preserves attributable referral evidence, not an execution of the excluded route.

**Maintenance — UC-13, RF-021, RF-022/022A and RF-024.** An intervention records attributable opening, scope and declared operational status; actions and verification outcomes are separate facts. Closing an intervention and claiming recovery are not equivalent: record the observed check, time and outcome; failed or unknown verification cannot assert restored operation. Record corrections without rewriting history. This contract grants no operational authority, automates no backup/restore and does not prove cryptographic integrity. Detailed transitions and verification capabilities belong to BE-014.

## Acceptance scenarios (specified, not executed)

| Scenario | Expected durable state and observable result |
|---|---|
| Successful mutation; then forced audit-write failure | Success: business change and linked event both commit. Failure: neither change nor success event survives; no false success response. |
| Denied access or failed operation | When policy requires it, separate `denied` or `failure` evidence with known attributable context; no business write or successful evidence. |
| Authorized audit consultation | Only allowed events and counts are released; a `read` event commits with the exact disclosed IDs. For an empty authorized page, no consulted IDs. After restart, verify the committed event and links. |
| Out-of-scope detail or audit unavailable | Out-of-scope case and missing case have the same `404`; scoped search results/counts do not leak it. Forced mandatory audit failure returns `503` without data; no success evidence. |
| Correction and payload boundary | Correction and original remain queryable according to authorization. Reject a forged actor, an unknown source or disallowed payload; assert that no rejected secret reaches stored evidence or exposed errors. |
| Simulator confirmation / timeout / error | Each result yields one preserved attempt. Confirmation requires synthetic evidence; timeout remains unknown; error retains sanitized failure. Neither timeout nor error generates delivery-success evidence. |
| Authorized retry with unchanged key | Same logical exchange, new attempt, previous evidence preserved; no independently confirmed second exchange. Changed payload or unhandled ambiguity does not dispatch. |
| Intervention verification failed or unknown | The action and result may be recorded, but no evidence claims successful recovery. |

Sources: UC/RF identifiers above and UC-12/RF-023; [data foundation AJ-04](data-foundation-v1.md#aj-04--identity-and-audit-contracts); `frontend/src/data/exchanges.ts`, `frontend/src/views/EvidenceList.tsx`, `frontend/src/views/InterventionList.tsx`. Those screens use local demo state and do not establish server grants or external confirmation. Implementation and runtime tests belong to the respective cards.
