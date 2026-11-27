# Backend TRASU

**Estado:** base inicial de BE-002 (arranque, `/health`, OpenAPI, TypeORM y seguridad cerrada por defecto). Sin autenticación ni módulos de negocio. Solo el integrante I2 (o un sustituto autorizado) inicializa NestJS. No crear proyectos NestJS paralelos.

Stack: Node 24 LTS, npm, NestJS, TypeScript, PostgreSQL, TypeORM, REST/OpenAPI, Jest/Supertest. Ver `../docs/architecture.md` y `../docs/engineering-plan.md`.

## Estructura al implementar
```text
src/
  main.ts
  app.module.ts
  config/
  common/                 # solo utilidades realmente compartidas
  database/
    data-source.ts
    migrations/
    seeds/
  modules/
    auth/
    cases/
    documents/
    monitoring/
    audit/
    exchanges/
    operations/
test/
```
Dentro de cada módulo, crear controller, servicios, DTOs, entidades y pruebas cuando sean necesarios. No generar módulos vacíos ni endpoints ficticios. Los nombres son iniciales; los contratos fijan comportamiento.

## Referencia del encargo de bootstrap (BE-002)
Generar el scaffold en un directorio temporal fuera del repositorio con Nest CLI compatible, sin Git anidado; incorporar selectivamente a `backend/`, preservando este README. Fijar dependencias y lockfile, documentar configuración de entorno y scripts reales (build, lint, test, e2e, migration), configurar health, OpenAPI y TypeORM con sincronización deshabilitada. Implementar CI backend cuando existan scripts que ejecutar. Acordar con I1 variables de conexión y orden de migraciones. No instalar dependencias en la raíz. Las instrucciones ejecutables se agregan a este README al terminar BE-002; no se declaran comandos inexistentes.

## Ejecutar
Requisitos: Node 24 y el PostgreSQL del `README.md` raíz en marcha.

```sh
cd backend
npm ci
npm run migration:run
npm run start:dev
```

- Estado: <http://127.0.0.1:3000/health> (200 con base disponible; 503 si no).
- OpenAPI: <http://127.0.0.1:3000/api/docs> (JSON en `/api/docs-json`). Desactivado con `NODE_ENV=production`.
- La API usa el prefijo `/api/v1`; `/health` queda fuera.
- Escucha solo en `127.0.0.1`. El despliegue (BE-016) deberá revisarlo.

## Variables de entorno
Se leen del entorno, luego de `backend/.env` y del `.env` raíz. La aplicación no arranca si son inválidas.

| Variable | Obligatoria | Por defecto |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Sí | — |
| `POSTGRES_HOST` | No | `127.0.0.1` |
| `POSTGRES_PORT` | No | `5432` |
| `PORT` | No | `3000` |
| `NODE_ENV` | No | `development` (`test`, `production`) |
| `CORS_ORIGINS` | No | vacío (sin CORS); lista separada por comas, sin `*` |

Nombres de conexión alineados con `compose.yaml`; pendientes de confirmar con I1.

## Comprobaciones
```sh
npm run lint
npm run build
npm test
npm run test:e2e   # requiere PostgreSQL real y las variables anteriores
```

## Migraciones
Archivos en `src/database/migrations/` (aún no hay ninguna). El orden lo revisa I1.

```sh
npm run migration:generate -- src/database/migrations/NombreDelCambio
npm run migration:show
npm run migration:run
npm run migration:revert
```

## Seguridad: contrato inicial (por acordar con I3, I4 e I5)
- Todo endpoint exige actor salvo `@Public()`. Hasta BE-007a nadie lo asigna: responden 401.
- `CurrentActor`: `{ id, roles }`, obtenido con `@Actor()`.
- Cada operación invoca la política con el recurso concreto:
  `await this.policy.assertAllowed({ actor, action, resource: { type, id } })`.
  La implementación provisional deniega todo (403).
- CSRF y sesiones corresponden a BE-007a.

## Errores
```json
{ "statusCode": 400, "error": "Bad Request", "message": "...", "path": "/api/v1/...", "timestamp": "..." }
```
Los errores 5xx no exponen detalles internos.
