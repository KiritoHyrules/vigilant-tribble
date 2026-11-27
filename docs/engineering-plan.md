# TRASU — Plan operativo de construcción del backend y base de datos

> Estado operativo: consultar el [Kanban versionado](#kanban-operativo). Los Issues enlazados conservan el alcance, el historial y las evidencias de ejecución.

**Equipo:** cinco integrantes, 3–4 h/día por persona, conocimientos equivalentes como supuesto y agentes de IA disponibles. **Objetivo:** MVP académico con prácticas de ingeniería cercanas a producción, frontend vigente preservado. **Alcance inmediato:** primer incremento real, no promesa de terminar el MVP en una fecha no confirmada.

## Kanban operativo

Estado verificado el 2026-11-27: **1 Done, 4 Ready, 13 Backlog**. Este es el único tablero operativo en Markdown; no mantener una copia local paralela. Los cambios de estado se registran en esta tabla con evidencia enlazada al Issue o PR. Una etiqueta histórica no prevalece sobre el cierre verificado de un Issue.

| Tarjeta | Responsable | Estado | Evidencia o condición de entrada |
|---|---|---|---|
| [BE-001](https://github.com/KiritoHyrules/vigilant-tribble/issues/2) | I1 | Done | Contrato ratificado e integrado mediante [PR #22](https://github.com/KiritoHyrules/vigilant-tribble/pull/22); Issue cerrado. |
| [BE-002](https://github.com/KiritoHyrules/vigilant-tribble/issues/3) | I2 | Done | [Aprobación de I1](https://github.com/KiritoHyrules/vigilant-tribble/pull/20#pullrequestreview-6083824236); [PR #20](https://github.com/KiritoHyrules/vigilant-tribble/pull/20) fusionado por squash en [`2466758`](https://github.com/KiritoHyrules/vigilant-tribble/commit/2466758cd36a8b1be938b2a12df20c5fd51d55d6); Issue cerrado por `Closes #3`. |
| [BE-003](https://github.com/KiritoHyrules/vigilant-tribble/issues/4) | I3 | Ready | Abierta; puede contrastar el contrato de expedientes con la base integrada. |
| [BE-004](https://github.com/KiritoHyrules/vigilant-tribble/issues/5) | I4 | Ready | Abierta; puede avanzar el contrato documental. |
| [BE-005](https://github.com/KiritoHyrules/vigilant-tribble/issues/6) | I1 (temporal; antes I5) | Done | [Contrato ratificado](../contracts/audit-exchange-operations-v1.md), integrado en [PR #24](https://github.com/KiritoHyrules/vigilant-tribble/pull/24); Issue cerrado. |
| [BE-006](https://github.com/KiritoHyrules/vigilant-tribble/issues/7) | I1, con I2/I3 | Done | Migración, semilla ficticia y pruebas integradas con el PR que cierra el Issue #7. |
| [BE-007a](https://github.com/KiritoHyrules/vigilant-tribble/issues/8) | I2 | Ready | G1 y tablas de identidad de BE-006 integrados. |
| [BE-007b](https://github.com/KiritoHyrules/vigilant-tribble/issues/9) | I3 | Backlog | G1, BE-003, BE-006 y política de I2. |
| [BE-008](https://github.com/KiritoHyrules/vigilant-tribble/issues/10) | I1 (temporal; antes I5) | Done | Migración y servicio de auditoría incorporados por el PR que cierra el Issue #10; consumo HTTP de identidad y expedientes en las tarjetas respectivas. |
| [BE-009a](https://github.com/KiritoHyrules/vigilant-tribble/issues/11) | I4 | Backlog | G1, contrato de BE-004, IDs y FK aprobados para persistencia. |
| [BE-010](https://github.com/KiritoHyrules/vigilant-tribble/issues/12) | I1, con I2/I3 | Backlog | BE-007a, BE-007b y BE-008. |
| [BE-011](https://github.com/KiritoHyrules/vigilant-tribble/issues/13) | I3 | Backlog | BE-007b, BE-008 y transiciones de BE-003. |
| [BE-009b](https://github.com/KiritoHyrules/vigilant-tribble/issues/14) | I4 | Backlog | BE-009a, BE-011, BE-008 y contrato de BE-004. |
| [BE-012](https://github.com/KiritoHyrules/vigilant-tribble/issues/15) | I5 | Ready | Puede comenzar el trabajo que no requiere la salida ordinaria. La salida ordinaria sigue pendiente de BE-009b. |
| [BE-013](https://github.com/KiritoHyrules/vigilant-tribble/issues/16) | I1 | Backlog | BE-007b y BE-011; BE-009b solo para pendientes documentales. |
| [BE-014](https://github.com/KiritoHyrules/vigilant-tribble/issues/17) | I5 | Ready | BE-008 y contrato de mantenimiento de BE-005 integrados; mantener autorización por operación. |
| [BE-015](https://github.com/KiritoHyrules/vigilant-tribble/issues/18) | I1–I5, por módulo | Backlog | Flujo implementado y contrato aprobado por módulo. |
| [BE-016](https://github.com/KiritoHyrules/vigilant-tribble/issues/19) | I1 e I2 | Backlog | G2 y autorización de proveedor, presupuesto y acceso. |

**G1 acreditado:** scaffold integrado en [PR #20](https://github.com/KiritoHyrules/vigilant-tribble/pull/20), PostgreSQL 17 verificado en una instancia aislada y [contrato de identidad, expediente y auditoría](../contracts/data-foundation-v1.md) ratificado e integrado en [PR #22](https://github.com/KiritoHyrules/vigilant-tribble/pull/22). G1 no sustituye las dependencias específicas de cada tarjeta.

**Seguimiento de I2:** la auditoría de BE-002 registró 19 alertas moderadas de desarrollo y 0 de producción. No se realizaron actualizaciones adicionales ni se repitieron esas pruebas para consolidar el tablero.

## 1. Decisiones de dirección técnica

- Monorepositorio existente: https://github.com/KiritoHyrules/vigilant-tribble. `frontend/` conserva dependencias, diseño y convenciones. `backend/` independiente.
- Backend NestJS/TypeScript, Node.js 24 LTS, npm, PostgreSQL y TypeORM con migraciones versionadas; `synchronize: false`. Fijar versiones compatibles mediante lockfile. API REST `/api/v1`, OpenAPI, class-validator, Jest/Supertest, Playwright, Docker Compose, GitHub Actions. Un monolito modular, no microservicios.
- Desarrollo local con una BD PostgreSQL por persona. Cloud de validación después del primer incremento; proveedor y presupuesto no confirmados. No bloquear construcción por ello. Datos exclusivamente ficticios.
- Identidad local del MVP, credenciales de prueba distintas de las cuentas demo públicas, contraseñas con hash seguro, sesiones autenticadas revocables y expirables (cookie HttpOnly, SameSite, Secure bajo HTTPS; protección CSRF de escrituras y orígenes explícitos). No simular permisos en la API. SSO institucional pendiente y fuera del incremento.
- Reglas de negocio RN-D-001…022 y RN-P-001…010: preservar como baseline del proyecto por decisión del responsable; no revalidación normativa en esta etapa. No afirmar certificación legal. RF conservar intención y granularidad exigida; ambigüedades se registran y resuelven antes de implementar el fragmento afectado. RNF: reformular criterios técnicos no medibles sin eliminar las necesidades. Usar especificaciones UC-01…13 del capítulo 12 como referencia inicial, no la numeración discordante del diagrama global. No usar el modelo de datos ni las interfaces antiguas como baseline. No automatizar decisiones jurídicas, firma, notificación ni archivo.
- Fuentes: informe académico compartido privadamente por el equipo, §§5, 11.1, 11.2 y 12; repositorio README, CONTRIBUTING y frontend/PRODUCT.md. No se han ejecutado las pruebas ni inspeccionado todos los archivos fuente; cada responsable extrae el contrato real de su área desde el clon local.

## 2. Responsables (no cargos permanentes)

| Persona | Dominio | Propiedad temporal | RF / UC |
|---|---|---|---|
| I1 (coordinador) | Datos compartidos, integración y luego seguimiento | compose, configuración de persistencia, migraciones y coordinación de contratos | RF-014, 015A, 027 / UC-08 |
| I2 | Fundamentos NestJS, identidad y autorización | bootstrap, auth, users, access | RF-020, 026; transversal |
| I3 | Expedientes y responsabilidades | cases, assignments, reassignments | RF-001–007, 025 / UC-01–04 |
| I4 | Ciclo documental | documents, versions, reviews, observations | RF-008–013 / UC-05–07 |
| I5 | Auditoría, intercambios y operación | audit, exchanges, operations | RF-016–019, 021–024 / UC-09–13 |

I1 aprueba cambios del esquema y de interfaces compartidas, no monopoliza su implementación. Cada dueño propone entidades/migraciones de su módulo y entrega tests. I2 no concentra toda la seguridad: cada operación de negocio invoca la política común con el recurso concreto. El coordinador también programa; los revisores se rotan y nadie aprueba su propio PR.

## 3. Reglas operativas desde el primer minuto

1. Clonar el repositorio (`git clone git@github.com:KiritoHyrules/vigilant-tribble.git` si SSH está configurado), `git switch main`, `git pull --ff-only`. Verificar `git status` limpio y anotar `git rev-parse HEAD`. Todos comienzan con el mismo commit. No borrar cambios ajenos.
2. En `frontend/`: `npm ci`, `npm run typecheck`, `npm run build`; ejecutar `npm run test:e2e -- --workers=1 --reporter=line` según README y requisitos de Chrome. Registrar fallos preexistentes sin arreglarlos fuera de la tarea. I1 registra baseline; los demás pueden inspeccionar sus vistas sin esperar toda la suite.
3. Kanban versionado: Backlog, Ready, In progress, Review y Done; los bloqueos se registran en el Issue con causa y responsable de desbloqueo. Una tarea activa por integrante, hasta cinco en ejecución. Revisión tiene prioridad sobre comenzar otro Issue. Crear rama desde main actualizado: `git switch -c feat/BE-xxx-descripcion`. Solo I2 inicializa NestJS. No usar `git push --force` ni modificar main directamente. PR pequeño, enlazado al Issue; aprobación ajena, CI y revisión de migraciones/contratos cuando aplique. Si alguna regla de protección no está disponible, aplicar manualmente.
4. Los cinco agentes reciben este documento, el informe local (no subir material privado al repo público), las instrucciones del repo y solo la tarjeta asignada. No cambian otros módulos, dependencias, reglas, diseño visual o datos comunes sin aprobación; no inventan campos/permisos. No ejecutar comandos destructivos ni exponer secretos. Cada agente entrega diff, comandos y resultados, supuestos y bloqueos. No declarar pruebas que no ejecutó.
5. Convenciones: timestamps de eventos en UTC y fechas civiles de plazos en America/Lima; IDs internos UUID (propuesta técnica), referencias externas distintas del PK; errores consistentes 400/401/403 o 404 según política de ocultación/409/500 sin filtración de datos; paginación explícita; DTOs separados de entidades; estado de negocio mediante operaciones explícitas, no PATCH genérico; decisiones y evidencia de cambios en una misma transacción local. No alterar historial para corregirlo.
6. Fuente única de migraciones: `backend/src/database/migrations/` (ruta propuesta, fijar en bootstrap). I1 serializa el orden y revisa colisiones. Un archivo de migración por cambio lógico, no editar migración aplicada. Sin tablas creadas manualmente en cloud; seed idempotente y solo demo; credenciales mediante env local no versionado. No usar SQLite para sustituir pruebas PostgreSQL.
7. Contrato API: cada operación se documenta con método, ruta, actor/atribución, payload, respuesta y errores; publicar OpenAPI desde código y comprobar compatibilidad. Antes de programar una interfaz compartida, acordar su tipo con consumidor. Nombres y endpoints siguientes son candidatos hasta contraste con el frontend.
8. Definition of Done (todas las tarjetas): criterio funcional probado, casos negativos cuando apliquen, build/typecheck/test exitosos, migración desde BD vacía y actualización cuando corresponda, documentación mínima actualizada, diff acotado, PR aprobado e integrado. No se considera Done por tener código generado.

## 4. Primera sesión (3 horas/persona): cinco tareas ejecutables inmediatamente

Las fichas de esta sección describen el alcance original; el estado vigente se consulta en el [Kanban operativo](#kanban-operativo).

Objetivo: acordar un contrato mínimo, tener NestJS arrancable y preparar pruebas/implementación sin colisiones. Estimaciones orientativas; 15 horas-persona brutas, no comprometer más de lo que pase los gates.

### BE-001 — I1 — Datos compartidos v0 (2–3 h; revisor I3)
**Done.** El [contrato ratificado](../contracts/data-foundation-v1.md) documenta el esquema, las restricciones compartidas y la evidencia de PostgreSQL aislado. Las dependencias de implementación restantes aparecen en la sección 5.

### BE-002 — I2 — Inicializar backend y CI (2–3 h; revisor I1)
**Ready.** Único responsable del scaffold. Crear NestJS dentro de `backend/`, sin inicializar Git anidado. Configurar TypeScript, scripts build/test/lint, `ConfigModule` con validación de variables, prefijo API, `/health`, OpenAPI y TypeORM con conexión por env; deshabilitar sincronización automática. Crear test de health, README y workflow de CI backend con PostgreSQL de prueba cuando corresponda. Definir `CurrentActor` (id y roles) y firma inicial de política de autorización con I3/I4/I5. Usar placeholders que fallen cerrados, nunca autenticación ficticia en endpoints protegidos. PR temprano del esqueleto para desbloquear a otros. **Aceptación:** `npm ci`, `npm run build`, tests y health ejecutados; backend separado; config documentada. **Desbloquea:** BE-006–011. Si falta tiempo, entregar scaffold/health primero y abrir tarjeta para CI/config restante.

### BE-003 — I3 — Contrato de expedientes/asignación (2–3 h; revisor I1)
**Ready.** Inspeccionar vistas, datos demo, tipos y handlers de expedientes y gestión de responsables del frontend vigente. Mapear operación a UC-01/02 y RF-001–005/025, después UC-03/04 y RF-006/007. Especificar campos requeridos, duplicidad, clasificación, incidencias, responsables por ámbito y acciones de asignación/reasignación. Definir contrato para incorporar, listar/consultar y asignar; enviar a I1 esquema y constraints; a I2 permisos y a I5 eventos. Preparar casos de prueba: duplicidad, clasificación ausente, asignación no autorizada, segundo intento de asignación. No crear otro scaffold ni tablas aisladas. **Aceptación:** contratos y pruebas especificadas con referencias a archivos reales y RF/RN; listo para implementar BE-007.

### BE-004 — I4 — Contrato ciclo documental (2–3 h; revisor I3)
**Ready.** Inspeccionar editor/documentos y revisiones del frontend, formatos y estructura de observaciones. Mapear UC-05/06/07 y RF-008–013. Especificar identidad de versión, concurrencia, contenido/almacenamiento, anclaje a sección/párrafo, ruta revisor→vocal o directa cuando aplique, observaciones y subsanación parcial; conservar hash y trazabilidad requerida por RF-012. Proponer entidades y restricciones al I1, permisos al I2 y eventos al I5. Preparar tests de versión inmutable, ruta obligatoria, no herencia y observación parcial. **Aceptación:** contrato y transiciones documentados sin modificar UI; incertidumbres de anclaje o formato identificadas; BE-009 desbloqueado cuando contratos comunes estén integrados.

### BE-005 — I1 (temporal) — Contrato auditoría y adaptadores (2–3 h; revisor I2)
**Done.** El [contrato integrado](../contracts/audit-exchange-operations-v1.md) define auditoría, el esquema aprobado y los límites del simulador y de mantenimiento. No incorpora una API institucional.

**Gate G1:** scaffold único integrado en main, BD local arrancable, contrato mínimo de identidad/expediente/auditoría aprobado y tareas específicas con archivos reales identificados. No hace falta que el modelo completo esté finalizado. Si no se supera, nadie genera una arquitectura alternativa: se resuelve el bloqueo concreto y los demás avanzan con tests, DTO y lógica pura de su dominio.

## 5. Segunda ola: primer incremento real

Cada tarjeta se subdivide si supera una sesión. Estimaciones de esfuerzo no son fechas de entrega. Los cinco comienzan por la tarjeta habilitada en su frente; no esperar a completar el modelo global.

| ID | Dueño | Depende de | Trabajo y criterio verificable |
|---|---|---|---|
| BE-006 | I1 + I2/I3 autores de entidades | G1 | Primera migración: usuarios/roles, expedientes y responsabilidad vigente e historial según contrato. Seed ficticio, FK, unicidad y pruebas de restricciones. BD vacía migra y arranca. |
| BE-007a | I2 | G1, BE-006 identidad | Login/logout/identidad actual; protección por defecto; hash de contraseña, sesión expirable y revocable, secretos en env, denegar 401/403. Tests de sesión válida, inválida, revocada y rol incorrecto. |
| BE-007b | I3 | G1, BE-006, política I2 | Incorporación y consulta autorizada de expediente, duplicidad e incidencia. Implementar servicio, DTO, controller, persistencia y tests de alcance por recurso. |
| BE-008 | I1 (temporal) | G1, esquema audit | Persistir eventos de negocio append-only mediante servicio común; misma transacción para mutación y evento de éxito. Test de rollback y lectura autorizada; consultas de auditoría registradas según RF-023. La cadena SHA-256/job diario queda como decisión RNF posterior, no como seguridad demostrada. |
| BE-009a | I4 | G1, IDs y FK aprobados | Crear proyecto y versión identificada, persistencia real, autor/fecha, control de concurrencia y contenido exacto. Tests de inmutabilidad tras envío y conflicto de edición. Puede desarrollar tests/lógica antes de integrar BD. |
| BE-010 | I1, apoyo I3/I2 | BE-007a/b, BE-008 | Walking skeleton: conectar acceso y consulta de un expediente del frontend a la API real, preservar UI, sustituir mock solo en ese recorrido, manejar carga/error. Test end-to-end y persistencia tras reinicio. |
| BE-011 | I3 | BE-007b, BE-008 | Asignación inicial, solicitud motivada y decisión transaccional. Tests: rechazo no cambia titular, aprobación conserva historial, doble decisión concurrente no cambia dos veces, actor no autorizado no muta. |
| BE-009b | I4 + apoyo liberado | BE-009a, BE-011, BE-008 | Someter versión, ruta revisor/vocal, aprobar/observar, nueva versión subsanada y trazabilidad granular. Cada acción con tests y conexión a pantalla correspondiente. |
| BE-012 | I5 | BE-008, BE-009b para salida ordinaria | Adaptador simulado y registro salida/intentos/idempotencia, derivación especial sin automatizar procedimiento. Fallo, ambigüedad, éxito confirmado y reintento con misma clave probados. |
| BE-013 | I1 + apoyo liberado | BE-007b, BE-011; BE-009b para pendientes documentales | Bandejas según alcance, filtros, fechas, cálculo temporal solo cuando datos/régimen suficientes, alertas sustentadas. Pruebas con calendario hábil, suspensiones/prórrogas y datos incompletos según RN; no inventar feriados/reglas. |
| BE-014 | I5 | BE-008 | Mantenimiento: iniciar/cerrar intervención, estado operativo visible, comprobación automatizada explícita de integridad/recuperación; no prometer certificación absoluta. |
| BE-015 | Todos | Flujos implementados | Integración frontend restante por módulo; pruebas positivas/negativas y regresión; documentar cobertura RF y operaciones todavía demo. |
| BE-016 | I1 + I2, todos revisan | G2 | Entorno cloud de validación cuando presupuesto/proveedor definidos; HTTPS, DB persistente privada, secretos, migraciones, seed demo, smoke test, backup/restauración verificada. No publicar datos reales. |

**Gate G2 (objetivo recomendado para el próximo avance):** autenticación y consulta de expediente reales, PostgreSQL con migraciones/seed, autorización positiva y negativa, evidencia de auditoría, y frontend conectado al menos en un recorrido. Mostrar qué módulos adicionales están listos; no presentar mocks como completados. Si el plazo es mayor, continuar BE-011/009b/012/013/014 según dependencias. No se conoce la fecha exacta ni el criterio oficial del avance: G2 es una propuesta de entrega, no una obligación confirmada.

## 6. Diseño de datos por incrementos: responsabilidad I1

El [contrato de fundamentos de datos v1](../contracts/data-foundation-v1.md) define las siete tablas aprobadas para BE-006. Las tablas de cuentas, incorporación, decisiones y auditoría pertenecen a sus respectivas tarjetas.

No diseñar a ciegas todo el ERD. Base candidata de conceptos (no tablas aprobadas): identidad/rol/sesión; expediente/referencia/clasificación/incidencia; asignación por ámbito/solicitud/decisión; proyecto/versiones/revisiones/observaciones/atenciones; eventos de plazos y calendario; intercambio/intento/derivación; eventos auditables y mantenimiento. Cada responsable aporta evidencia del frontend y RF/RN, I1 concilia y aprueba el esquema de cada incremento. La BD garantiza lo que puede garantizar declarativamente (PK, FK, UNIQUE, CHECK); el servicio verifica atribuciones, invariantes que cruzan relaciones y transiciones dentro de transacciones. Evitar duplicar estado derivable sin justificación. No usar cascadas de borrado sobre historial. Para responsabilidad vigente por ámbito evaluar restricción única parcial; para duplicidad de expediente, definir equivalencia institucional antes de imponer unicidad; para decisiones concurrentes, transacción y bloqueo o versión optimista. No imponer cardinalidad o campos sin evidencia.

Proceso por cambio: propuesta de entidad/relación → revisar consumidores y reglas → aprobar → autor del módulo genera migración → I1 revisa orden y compatibilidad → CI con PostgreSQL real → PR. Cada desarrollador aplica localmente migraciones aprobadas; staging se actualiza exclusivamente desde main. Los diagramas conceptual/lógico/físico son resultado del diseño acordado, no requisito para comenzar todos los módulos.

## 7. Coordinación y revisión diaria

Primeros 10 min: cada uno dice qué entregó, qué issue ejecutará y bloqueo específico. Al final de cada sesión: PR o evidencia verificable, estado y dependencia desbloqueada. Priorizar revisiones y dependencias comunes. Si I4 está sobrecargado, I2 o I3 toma una tarjeta de pruebas/versiones claramente separada una vez termine su dependencia; si I1 está bloqueado, otra persona revisa propuestas y él resuelve exclusivamente el contrato crítico. No crear tareas de documentación desconectadas del código. Reserva 20–25% de capacidad para revisión, integración y fallos como supuesto de planificación, no medición. Las horas adicionales del coordinador no son requisito del plan.

## 8. Instrucción común para el agente (pegar junto a la tarjeta)

> Actúa como desarrollador de TRASU. Lee este plan, CONTRIBUTING.md, README y los archivos reales del dominio asignado; usa el informe solo para RF, RN y UC detallados. No uses modelos de datos ni interfaces antiguas como baseline. Ejecuta exclusivamente la tarjeta que te entrego. Primero identifica archivos y dependencias, confirma el contrato compartido y muestra cambios previstos. Si existe bloqueo, registra el dato que falta y realiza la parte no bloqueada sin inventar reglas ni interfaces. No modifiques diseño visual, módulos ajenos, dependencias o migraciones ajenas sin aprobación. Usa el stack acordado, agrega pruebas positivas y negativas, ejecuta comprobaciones, inspecciona diff y reporta resultados reales, archivos, supuestos y pendientes. No hagas push a main ni publiques secretos. No marques tarea Done hasta cumplir sus criterios y revisión humana.

## 9. Evidencia para demostración

Desde clon limpio: arrancar PostgreSQL local, instalar dependencias, migrar/seed, arrancar backend/frontend, ejecutar pruebas. Mostrar acceso válido, inválido y consulta autorizada; intentar acceder fuera de ámbito y demostrar que se deniega; verificar datos tras reiniciar servidor; mostrar trazabilidad persistente. Si se completó asignación, demostrar solicitud, decisión e historial; si se completó documental, demostrar revisión y nueva versión sin perder la anterior. Documentar cada flujo no implementado como pendiente y distinguir interfaces institucionales simuladas de lógica real.

**Limitaciones y decisiones delegadas:** nombres de módulos/endpoints/entidades son propuestas de dirección técnica sujetas al contraste con el código real; la línea base del bootstrap está en [arquitectura](architecture.md). El presupuesto cloud y la fecha no están confirmados. Este documento ordena la construcción, no certifica que el sistema esté construido.
