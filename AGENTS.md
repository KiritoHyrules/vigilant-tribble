# Instrucciones para agentes — TRASU

Aplica a todo el repositorio. Lee también las instrucciones locales y `CONTRIBUTING.md`, `docs/architecture.md`, `docs/engineering-plan.md` y el Issue asignado. Estas normas complementan, no sustituyen, la revisión humana.

## Alcance y fuentes
- Mantener el frontend vigente y sus dependencias, integración Figma, pruebas y convenciones. No rediseñarlo ni sustituir mocks fuera del flujo de la tarjeta.
- El alcance y las reglas de negocio ratificadas prevalecen; el informe académico compartido externamente aporta RF/RN y UC detallados del capítulo 12. No usar diagramas o modelos de datos antiguos como diseño aprobado. No subir el informe ni fuentes privadas. Cuando una regla o atribución no esté disponible, registrar el bloqueo y avanzar solo en la parte verificable.
- Backend NestJS/TypeScript, Node 24, npm, PostgreSQL, TypeORM, API REST `/api/v1`, OpenAPI. Dependencias separadas; no microservicios. No inferir permisos, campos ni efectos jurídicos de una pantalla.
- Datos ficticios exclusivamente. No exponer secretos, datos institucionales, contenido documental privado o credenciales en commits, logs, issues o PR. No reutilizar las cuentas demo públicas para autenticación real.

## Procedimiento de una tarjeta
1. Comprobar `git status`, rama, commit base e Issue. Identificar archivos y dependencias reales. No tocar cambios ajenos; si el árbol no está limpio, detener la integración y explicar el conflicto.
2. Confirmar contrato compartido antes de modificarlo. I1 revisa esquema/migraciones; I2 define bootstrap y política de identidad/acceso. Cada dueño implementa y prueba su módulo. Solo I2 inicializa NestJS (salvo reasignación explícita).
3. Trabajar en rama breve, con un objetivo, sin reformateo global, cambios fuera del Issue ni instalación de dependencias innecesarias. No usar `git reset --hard`, `git clean -fd`, force push ni escribir directamente en main.
4. Usar validación en servidor, autorización sobre recurso y transacciones donde corresponda. TypeORM `synchronize: false`; migraciones versionadas, no editar migraciones aplicadas. No ejecutar migraciones contra una BD compartida o productiva sin autorización.
5. Ejecutar comprobaciones reales y tests positivos/negativos. No sustituir PostgreSQL con SQLite para verificar restricciones específicas. Revisar diff, secretos y artefactos. No afirmar que una prueba pasó si no se ejecutó.
6. Entregar resumen, archivos cambiados, comandos y resultados, limitaciones y dependencias. PR vinculado al Issue, revisión de otro integrante y CI. No marcar Done antes de integración aprobada.

## Verificación
Frontend: desde `frontend/`, `npm ci`, `npm run typecheck`, `npm run build` y `npm run test:e2e -- --workers=1 --reporter=line` (Chrome requerido). Backend: seguir `backend/README.md` una vez inicializado; no inventar scripts aún no disponibles. Siempre `git diff --check`. Si una prueba falla por causa preexistente o ambiental, documentarla; no esconderla ni reescribir pruebas para que pasen.
