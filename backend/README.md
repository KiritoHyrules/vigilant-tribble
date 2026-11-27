# Backend TRASU

**Estado:** reservado para BE-002; este README no representa un servicio ejecutable. Solo el integrante I2 (o un sustituto autorizado) inicializa NestJS. No crear proyectos NestJS paralelos.

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

## Bootstrap (BE-002)
Generar el scaffold en un directorio temporal fuera del repositorio con Nest CLI compatible, sin Git anidado; incorporar selectivamente a `backend/`, preservando este README. Fijar dependencias y lockfile, documentar configuración de entorno y scripts reales (build, lint, test, e2e, migration), configurar health, OpenAPI y TypeORM con sincronización deshabilitada. Implementar CI backend cuando existan scripts que ejecutar. Acordar con I1 variables de conexión y orden de migraciones. No instalar dependencias en la raíz. Las instrucciones ejecutables se agregan a este README al terminar BE-002; no se declaran comandos inexistentes.
