# BE-007a — Local identity and sessions
Branch `feat/be-007a-local-auth`; independent PR; PostgreSQL 17 integration via Jest/Supertest.

## Specs
- S1: “Implementa las migraciones, entidades, servicios e interfaces de autenticación necesarios.”
- S2: “Login.” “Consulta de sesión actual.” “Logout.” “Identidad estable mediante participant.id.” “Roles determinados por el servidor.”
- S3: “Cookies y protección CSRF según la arquitectura.” “Denegación por defecto.” “Autorización por acción, recurso, atribución y responsabilidad.”
- S4: “Utiliza PostgreSQL 17 aislado para las pruebas automatizadas.” “No mezcles el código de mantenimiento con el PR de autenticación.”

## Tasks
- T1 — S1–S4, inline: identity persistence and HTTP sessions; risk 2; local checks passed, delivery pending.
- T2 — S3–S4, inline: resource policy and maintenance attribution; risk 2/3; local checks passed, delivery pending.

## Log
- L1: “MISIÓN — PREPARACIÓN DE BASE DE DATOS LOCAL Y ASUNCIÓN DE I2”; Issue #8, RF-020/026, architecture and integrated contracts bind this work.
- L2: Base `d1994b7`. Issue #8 ownership recorded. BE-014 branch remains `4f9e364`. Persistent local database configured separately, migrated from main only (nine domain tables).
- L3: RED: absent session route responded 404 instead of 401, and the original policy denied both supported positive attribution cases. GREEN on isolated PostgreSQL 17 and Node 24: incremental migration applied; lint/build, 25 unit tests, 34 integration tests and `git diff --check` passed. Candidate interfaces communicated to I3 in Issue #9. Independent security verification pending.
- L4: Independent verifier found no reproduced blocker; read-only credential/CSRF, attribution, transaction ownership and HTTP denial probes passed. Added its login and logout audit failure scenarios; the nine focused PostgreSQL tests passed, confirming durable session state is unchanged and no cookie is emitted on failed issuance. Full production maintenance workflow and concurrent disablement were not exercised.
