# BE-008 — Persistent audit
Branch `feat/be-008-audit`; delivery: separate PR after BE-005; runner: Jest against isolated PostgreSQL 17.

## Specs
- S1: “Implementa las entidades TypeORM y la migración incremental de las dos tablas aprobadas.” “Mantén intactas las siete tablas anteriores.”
- S2: “Exigir una transacción activa y un gestor vinculado a ella.” “No permitas registrar referencias consultadas sobre eventos que no correspondan a una lectura.”
- S3: “La autorización debe permanecer denegada por defecto.” “Si falla la auditoría obligatoria, responde conforme al contrato: 503 sin datos protegidos.”
- S4: “Utiliza pruebas de servicio y persistencia para verificar el núcleo independiente de auditoría.” “No declares verificadas las operaciones HTTP que dependan de I2 o I3 mientras esas implementaciones no estén disponibles.”

## Tasks
- T1 — S1–S4, inline: audit schema and service verified locally; items 1/2 (audit retention on rollback; visibility and mandatory write gate). Delivery pending BE-005 and review; HTTP integration with I2/I3 unverified.

## Log
- L1: User mission “CIERRE DE BE-005 E IMPLEMENTACIÓN DE BE-008”: BE-005 head `3d05d44` ratified; no new design; develop independently without integrating before its dependency. Full acceptance in Issue #10 and the ratified contracts.
- L2: PR #24 CI green, review still required. I1 approval recorded on #24. Branch based on the ratified candidate; G2 preparation remains separate at `df8f442`.
- L3: RED: schema test failed on the BE-006-only database because the two audit tables were absent. GREEN: migration applied, lint/build passed, and Node 24.22.3 with isolated PostgreSQL 17.12 passed 25 unit and 23 integration tests (5 audit), plus `git diff --check`. Independent verification pending.
- L4: The verifier identified destructive rollback; the isolated regression reproduced it before the fix. The migration now locks both audit tables and refuses rollback if either contains evidence. Added inactive/released manager and failed-commit regressions. Lint, build, `git diff --check` and 26 backend integration tests passed; targeted independent recheck pending.
- L5: Targeted verifier confirmed the original finding resolved by source review and observed PostgreSQL 17.12 and clean diff checks. No independent functional rollback was executed; functional RED/GREEN is from the parent suite.
