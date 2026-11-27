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
Requisitos: Node 24 (24.11 o superior) y el PostgreSQL del `README.md` raíz.

**PostgreSQL debe estar disponible para arrancar.** Sin él, la aplicación reintenta la conexión, termina con error y no atiende peticiones.

```sh
cd backend
npm ci
npm run migration:run
npm run start:dev
```

- Estado: <http://127.0.0.1:3000/health> (200 con base disponible; 503 si la API ya arrancó y pierde el acceso a PostgreSQL).
- OpenAPI: <http://127.0.0.1:3000/api/docs> (JSON en `/api/docs-json`). Desactivado con `NODE_ENV=production`.
- La API usa el prefijo `/api/v1`; `/health` queda fuera.
- Escucha solo en `127.0.0.1`. El despliegue (BE-016) deberá revisarlo.

## Variables de entorno
Se leen del entorno, luego de `backend/.env` y del `.env` raíz. La aplicación no arranca si son inválidas.

| Variable | Obligatoria | Por defecto |
|---|---|---|
| `POSTGRES_PASSWORD` | Sí (secreto local) | — |
| `POSTGRES_DB`, `POSTGRES_USER` | No | `trasu_dev` |
| `POSTGRES_HOST` | No | `127.0.0.1` |
| `POSTGRES_PORT` | No | `5432` |
| `PORT` | No | `3000` |
| `NODE_ENV` | No | `development` (`test`, `production`) |
| `CORS_ORIGINS` | No | vacío (sin CORS) |

`CORS_ORIGINS` es una lista separada por comas de orígenes HTTP(S) explícitos (por ejemplo `http://localhost:5178,https://app.ejemplo.pe`), sin barra final, ruta, consulta, fragmento, credenciales ni comodines. Un valor inválido impide el arranque.

## Configuración aprobada por I1 (revisión del PR #20)
Node.js 24 LTS, PostgreSQL 17, los valores por defecto de la tabla, `synchronize: false`, `migrationsRun: false`, migraciones en `src/database/migrations/` y entidades en sus módulos propietarios.

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

## Seguridad: línea base técnica compartida
`CurrentActor`, `AccessRequest` y `AccessPolicy` están aprobados por la dirección técnica (I1, PR #20). La identidad y los roles provienen de la autenticación del servidor, nunca de datos arbitrarios del cliente. Se deniega por defecto y la autorización definitiva dependerá del recurso, la responsabilidad y la atribución. La autenticación real corresponde a BE-007a. I3, I4 e I5 comprobarán la compatibilidad en BE-003, BE-004 y BE-005 e informarán a I1 cualquier incompatibilidad con evidencia.

- Todo endpoint exige actor salvo `@Public()`. Hasta BE-007a nadie lo asigna: responden 401.
- `CurrentActor`: `{ id, roles }`, obtenido con `@Actor()`.
- Cada operación invoca la política con el recurso concreto:
  `await this.policy.assertAllowed({ actor, action, resource: { type, id } })`.
  La implementación provisional deniega todo (403).
- CSRF y sesiones corresponden a BE-007a.

## Dependencias: alertas atendidas en BE-002
Cadena anterior: `typeorm@0.3.31` → `glob@10.5.0` → `minimatch@9.0.9`.

| Alerta | Rango afectado | Aplicabilidad observada |
|---|---|---|
| GHSA-3g3m-2fjr-6pw4 (`glob`) | >=9.0.0 <=14.0.1 (corregido en 14.0.2) | Requiere la opción `signal`; el cargador de TypeORM llama a `glob.sync` sin ella |
| GHSA-g3hv-75wg-m249 (`minimatch`) | npm audit: >=7.0.0 <11.0.1 | Requiere patrones controlados por un atacante; los del scaffold están fijos en el código |

Alternativas: no hay `glob` 10 ni `minimatch` 9 posteriores a los resueltos; forzar `glob` 14 con `overrides` sale del rango que declara TypeORM 0.3. Se actualizó a `typeorm@1.1.3`, que usa `tinyglobby` y está admitido por `@nestjs/typeorm@11.0.3`. Es un cambio de versión mayor, hecho antes de que existan entidades. `npm audit --omit=dev` queda en 0 alertas.

Riesgo residual: `npm audit` completo mantiene alertas moderadas en herramientas de desarrollo. Seguimiento: I2.

## Errores
```json
{ "statusCode": 400, "error": "Bad Request", "message": "...", "path": "/api/v1/...", "timestamp": "..." }
```
Los errores 5xx no exponen detalles internos.

## Data foundation (BE-006)

The first domain migration creates the seven tables defined in the
[BE-001 contract](https://github.com/KiritoHyrules/vigilant-tribble/pull/22).
Nest and the migration CLI load the same module-owned entities. PostgreSQL
owns the stored reference match key and both partial unique indexes.
Synchronization and automatic migrations remain disabled.

From `backend/`, against an isolated PostgreSQL 17 database:

```sh
npm run migration:show
npm run migration:run
npm run test:e2e
```

`npm run seed:demo` adds fictitious rows with stable keys; repeating it does not
duplicate them. It requires an explicit `NODE_ENV=development` or `NODE_ENV=test`
and a loopback PostgreSQL host. Run it only after migrating a disposable or
local demo database. It does not create accounts, passwords, or real roles for
any user.

`npm run migration:revert` drops the foundation tables and their contents.
Test rollback only against a disposable database. Do not use it to repair a
database that contains real or shared data.
