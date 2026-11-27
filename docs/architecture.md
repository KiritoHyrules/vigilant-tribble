# Arquitectura técnica — TRASU

El [contrato de fundamentos de datos v1](../contracts/data-foundation-v1.md) reúne las decisiones de G1 ratificadas por I1 y delimita la primera migración; su publicación no adelanta la implementación de dominio.

Estado: decisión de dirección para la etapa de construcción; no evidencia de implementación. Monolito modular, monorepositorio existente. Frontend React/TypeScript/Vite sin rediseño; backend NestJS/TypeScript con npm independiente, Node 24 LTS, PostgreSQL y TypeORM. Jest/Supertest para backend; Playwright existente para navegador; OpenAPI para contratos REST. Fijar versiones exactas compatibles en lockfiles durante bootstrap.

## Límites
- `frontend/`: UI, estado de interacción y cliente API. No fuente de autoridad de permisos o transiciones.
- `backend/`: identidad, autorización, expedientes/responsabilidades, ciclo documental, seguimiento/plazos, auditoría, intercambios y operación. Cada módulo expone operaciones de aplicación; otros módulos no escriben directamente en sus tablas sin contrato. Controllers validan DTOs y delegan; reglas y transacciones viven en servicios. No imponer capas vacías.
- `backend/src/database/`: configuración de TypeORM, migraciones y seeds demo. Entidades junto al módulo dueño. Una sola secuencia de migraciones. `synchronize: false`; claves, FK, restricciones e índices justificados; historial conservado.
- `contracts/`: contrato HTTP versionado; un único origen generado desde backend, no dos esquemas manuales divergentes.

## Acuerdos transversales
- **Base tecnológica de BE-002 (2026-11-27, [PR #20](https://github.com/KiritoHyrules/vigilant-tribble/pull/20)):** TypeORM `1.1.3` y `@nestjs/typeorm` `11.0.3` sobre Node.js 24 LTS (`>=24.11.0 <25`) y PostgreSQL 17. Las migraciones son explícitas y versionadas; `synchronize` y `migrationsRun` permanecen en `false`. Consultar [backend/README.md](../backend/README.md) para los comandos y el seguimiento de alertas de desarrollo a cargo de I2.
- IDs internos UUID como propuesta técnica; referencias institucionales separadas. UTC para eventos, America/Lima para fechas civiles de plazos. Cómputo no validado cuando falten datos/régimen.
- Auth local para MVP: contraseñas con hash seguro, sesiones expirables/revocables, cookie HttpOnly/SameSite/Secure bajo HTTPS; proteger escrituras contra CSRF, orígenes explícitos. `CurrentActor`, `AccessRequest` y `AccessPolicy` son la línea base compartida: la identidad y los roles provienen del servidor y se deniega por defecto. La autorización definitiva considera recurso, responsabilidad y atribución. La autenticación real corresponde a BE-007a; SSO institucional no implementado.
- Validación DTO, errores consistentes, paginación cuando se necesite, no exponer entidades crudas ni información sensible. Operaciones explícitas para transiciones. Mutación y evidencia de éxito en una misma transacción local; no inventar confirmaciones externas.
- Desarrollo: PostgreSQL local independiente por integrante. Entorno cloud de validación después del primer incremento; presupuesto y proveedor no definidos. No incluir credenciales ni datos reales. No simular el núcleo; solo adaptadores institucionales inaccesibles con éxito/error/timeout verificables.

## Decisiones pendientes
BE-001 y cada dominio preparan el modelo incremental y sus restricciones. El bootstrap de BE-002 ya fija versiones, scripts, configuración, formato de errores y contrato inicial de actor. I1 ratifica los contratos compartidos; los módulos consumidores comprueban compatibilidad y comunican discrepancias con evidencia. Se mantiene la revisión cruzada de los PR. Los contratos de estados, permisos, almacenamiento documental y API se derivan de código vigente y RF/RN, sin copiar modelos antiguos. Registrar cambios arquitectónicos significativos aquí con fecha, motivo e impacto; crear un ADR separado solo cuando la decisión lo justifique.
