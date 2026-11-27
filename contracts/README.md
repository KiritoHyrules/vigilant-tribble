# Contratos API

- [Ciclo documental (BE-004)](documentary-cycle-v1.md): contrato funcional candidato a revisión; no es OpenAPI ejecutable.
- [Auditoría, intercambios y mantenimiento (BE-005)](audit-exchange-operations-v1.md): contrato para revisión cruzada; no es OpenAPI ejecutable.

Durante BE-003/004/005, documentar operaciones con método, ruta candidata, actor/atribución, DTO, respuesta, errores, transiciones y pruebas. Acordar los datos compartidos con I1, autorización con I2 y auditoría con I5. No derivar permisos de los mocks del frontend.

Cuando BE-002 configure OpenAPI, el backend será la fuente de verdad ejecutable; publicar un `openapi.json` generado y revisado en los cambios de contrato. Evitar mantener a mano una segunda especificación incompatible. No se incluye un contrato ficticio en este kit.
