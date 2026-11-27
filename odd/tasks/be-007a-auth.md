# BE-007a — Local identity and sessions
Branch `feat/be-007a-local-auth`; independent PR; PostgreSQL 17 integration via Jest/Supertest.

## Specs
- S1: “Implementa las migraciones, entidades, servicios e interfaces de autenticación necesarios.”
- S2: “Login.” “Consulta de sesión actual.” “Logout.” “Identidad estable mediante participant.id.” “Roles determinados por el servidor.”
- S3: “Cookies y protección CSRF según la arquitectura.” “Denegación por defecto.” “Autorización por acción, recurso, atribución y responsabilidad.”
- S4: “Utiliza PostgreSQL 17 aislado para las pruebas automatizadas.” “No mezcles el código de mantenimiento con el PR de autenticación.”
- S5: “HTTPS obligatorio en producción.” “Excepción explícita para desarrollo HTTP local controlado.” “Rechazo antes de crear una sesión o emitir una cookie de autenticación.” “Ausencia de confianza indiscriminada en X-Forwarded-Proto.”

## Tasks
- T1 — S1–S4, inline: identity persistence and HTTP sessions; risk 2; local checks passed, delivery pending.
- T2 — S3–S4, inline: resource policy and maintenance attribution; risk 2/3; local checks passed, delivery pending.
- T3 — S2–S5, inline: admission limits (H1), UTF-8 denial evidence (H2), and session transport (H3); risk 2; local checks and focused independent verification passed; publication pending.

## Log
- L1: “MISIÓN — PREPARACIÓN DE BASE DE DATOS LOCAL Y ASUNCIÓN DE I2”; Issue #8, RF-020/026, architecture and integrated contracts bind this work.
- L2: Base `d1994b7`. Issue #8 ownership recorded. BE-014 branch remains `4f9e364`. Persistent local database configured separately, migrated from main only (nine domain tables).
- L3: RED: absent session route responded 404 instead of 401, and the original policy denied both supported positive attribution cases. GREEN on isolated PostgreSQL 17 and Node 24: incremental migration applied; lint/build, 25 unit tests, 34 integration tests and `git diff --check` passed. Candidate interfaces communicated to I3 in Issue #9. Independent security verification pending.
- L4: Independent verifier found no reproduced blocker; read-only credential/CSRF, attribution, transaction ownership and HTTP denial probes passed. Added its login and logout audit failure scenarios; the nine focused PostgreSQL tests passed, confirming durable session state is unchanged and no cookie is emitted on failed issuance. Full production maintenance workflow and concurrent disablement were not exercised.
- L5: The blocked native review was invalidated without approval after its transport failed to record reviewers' results. H1 bounds global and per-peer admission, with a documented residual distributed saturation risk. H2 records anonymous oversized UTF-8 denials. H3 RED: plaintext issuance returned 204, expected 403; GREEN: unapproved plain HTTP and unauthenticated proxy headers produce 403 with neither cookie nor session, while explicit local development and configured authenticated loopback proxy work. PostgreSQL 17: lint, build, 30 unit and 41 e2e tests passed. `.env.example` is protected by the runtime; configuration is documented in `backend/README.md`.
- L6: I3's PR #27 (`a7f3cfe`) uses the same participant identity and audit interfaces. Collection-level `case:read` without a UUID and supervisor visibility need an explicit cross-module decision; current BE-007a fails closed, and adds no case mutation grants. I4's doc-only PR #26 merged independently (`2a40c18`); no document schema or permission was imported here.
- L7: A direct TLS smoke probe booted the compiled application in production mode with a disposable certificate and no proxy headers. It observed HTTP 204, an HttpOnly/Secure/SameSite=Lax cookie and exactly one session in isolated PostgreSQL.
- L8: The focused H3 verifier reported no blocker: 16 controller/configuration probes passed, versus 11 failing on the previous commit. Its probes did not extend to resource authorization or replace the parent PostgreSQL and HTTPS runs. The previous native review remains invalidated, with no approval.
