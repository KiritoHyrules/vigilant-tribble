# BE-009a · Plan de pruebas de persistencia documental

Referencias: [Issue #11](https://github.com/KiritoHyrules/vigilant-tribble/issues/11) y
[contrato BE-004](../../contracts/documentary-cycle-v1.md) (§§3, 8 y 9).
BE-004 está integrado; las propuestas P-01 y P-03 publicadas en el Issue siguen
pendientes de ratificación por I1.

## Auditoría unitaria

La [suite existente](../src/modules/documents/document-version.rules.spec.ts)
ejercita siete casos de lógica pura:

| Caso | Comportamiento comprobado |
|---|---|
| 1 | Edición aceptada con contenido editable y contador vigente: devuelve el reemplazo exacto sin cambiar la entrada. |
| 2 | Edición rechazada con contador obsoleto sobre contenido editable (E-08, variante A: guarda local). |
| 3 | Edición rechazada sobre versión sometida aun con contador vigente (E-04: guarda local). |
| 4 | Contenido original conservado tras el rechazo por contador obsoleto. |
| 5 | Contenido original conservado tras el rechazo por versión sometida. |
| 6 | Búsqueda por ID devuelve la versión solicitada aunque exista otra posterior. |
| 7 | Una referencia inexistente no se sustituye por la última versión. |

No falta un escenario obligatorio para las dos funciones puras actuales.
Combinar ambos motivos de rechazo no introduce un resultado nuevo. El alta y la
relectura persistente, una carrera entre transacciones y la inmutabilidad después
de releer no quedan cubiertas por estos casos. Tampoco se comprueba la política
del contador (inicio, alcance o avance al confirmar): la regla pura solo compara
valores y no aplica la mutación persistente. No se añaden pruebas Jest duplicadas.

## Datos reutilizables

[`documentContentSamples`](fixtures/document-content.ts) aporta tres muestras
ficticias: un original con espacios significativos, tabulación, CRLF y un
carácter acentuado precompuesto; la primera variante solo cambia CRLF por LF y
la segunda solo cambia ese carácter por su forma descompuesta. Usar el original
para el alta y las dos variantes como cambios distinguibles en la carrera.

Las muestras son valores lógicos, no archivos de un formato admitido. Cuando
se ratifique P-01, preparar entradas válidas para ese formato y conservar antes
de escribir una referencia independiente de la representación exacta que deba
persistirse. Comparar el valor completo: igualdad estricta para texto o longitud
y cada byte si se ratifican octetos. No normalizar para comparar, ni usar solo
el nombre, la vista previa o la huella como prueba de igualdad. Para E-08A,
verificar que las tres representaciones de prueba sean distintas antes de correrlo.

## Integración con PostgreSQL · preparada, no ejecutada

Usar PostgreSQL 17 aislado y descartable, con las migraciones aprobadas aplicadas
y `synchronize: false`. Crear expediente y participantes ficticios por escenario.
Comprobar estados finales en una conexión independiente, después de que las
transacciones terminen. Probar el servicio de persistencia cuando exista; la
variante HTTP con Supertest requiere una política y un contrato HTTP acordados.

| Escenario | Precondiciones | Operaciones | Resultado esperado |
|---|---|---|---|
| **E-12 · Alta y relectura exacta** | Expediente elegible sin el proyecto de prueba, autor y lector con atribución cuando aplique, entrada válida preparada según P-01. | Crear proyecto y registrar `v1` de forma conjunta o separada según P-03. Confirmar; releer por el ID devuelto de `v1` desde otra conexión. | Proyecto ligado al expediente y versión al proyecto. Coinciden ID, número, autor, instante de registro (a la precisión acordada) y representación completa. `v1` queda sin envío, tarea ni decisión. |
| **E-08A · Ediciones concurrentes** | Versión editable con contenido original y contador conocido; dos sesiones independientes con permiso de edición cuando aplique. | Ambas sesiones leen el mismo contador y proponen contenidos distintos. Coordinar con una barrera para iniciar ambos intentos antes de que uno confirme; no simular la carrera con llamadas secuenciales ni depender de pausas. Repetir desde el preestado ordenando las confirmaciones para que pueda ganar cada intento. Releer al terminar ambos. | Una sola edición se confirma; la obsoleta se rechaza. Quedan exactamente el contenido ganador y un solo avance del contador conforme a P-03. Sin sobrescritura ni evidencia de éxito del intento rechazado, cuando corresponda P-06. |
| **E-04 · Inmutabilidad tras sometimiento** | Versión sometida persistida en un estado válido según P-03; capturar su ID, contenido, contador y metadatos, además de huella o decisiones si existen. Preparar el estado durante evaluación y, cuando esté disponible, después de resuelta. | Intentar reemplazar el contenido con una entrada válida y el contador vigente; releer por el mismo ID tras el rechazo. Si se ratifica una barrera en PostgreSQL, verificar también el rechazo de una actualización directa que eluda solo la guarda de servicio. | Se rechaza por inmutabilidad, no por un contador viejo o entrada inválida. Se conservan contenido exacto, ID, contador, metadatos y huella o decisiones previas cuando existan. El preestado es un dato de prueba; este escenario no implementa el sometimiento ni la revisión. |

### Candidatos adicionales · sujetos a ratificación

| Caso | Precondiciones y operación | Resultado esperado según la decisión final |
|---|---|---|
| **Integridad referencial** | Con los vínculos de expediente, proyecto y autor ratificados, intentar cada alta con una única referencia inexistente y el resto válido. Si se ratifican FK restrictivas, intentar también borrar una fila que tenga un dependiente válido. | PostgreSQL rechaza la escritura inválida; no quedan huérfanos. Bajo FK restrictivas, el borrado se rechaza y ambas filas quedan intactas. |
| **Numeración única por proyecto** | Insertar un número válido; repetirlo con otra identidad en el mismo proyecto, y después en otro proyecto elegible. Si se ratifica la positividad, probar cero y un negativo. | La repetición dentro del proyecto se rechaza sin alterar la versión previa; el mismo número en otro proyecto se acepta. La restricción de positividad, si se aprueba, rechaza ambos inválidos. |
| **Atomicidad** | Si se ratifica alta conjunta, provocar un fallo real de BD al registrar la primera versión después de escribir el proyecto y antes de confirmar. Si se ratifican altas separadas, provocar un fallo dentro de la operación de registro con un proyecto ya confirmado. Si P-06 exige evidencia de éxito para la operación, cubrir también el fallo al persistirla. | Una lectura independiente confirma rollback de las escrituras de la operación fallida: ni proyecto ni versión nuevos con alta conjunta; proyecto anterior intacto y sin versión parcial con alta separada. No queda evidencia de éxito de una operación fallida. |

## Bloqueos y responsables

- **P-01 · I1 con I4:** ratificar representación, formatos, límites y alcance
  de la huella antes de materializar las entradas válidas y la comparación real.
- **P-03 · I1 con I4:** ratificar IDs, FK, numeración, composición del alta,
  frontera de edición, contador y mecanismo de protección; I1 valida el orden
  de la migración. Sin esquema y servicio documental no se ejecutan estos casos.
- **P-05 · I2, I3 e I4:** acordar atribución, acceso, visibilidad y errores antes
  de habilitar operaciones protegidas o verificar su contrato HTTP.
- **P-06 · I5 e I1, con I2 para lecturas:** acordar cuándo se exige evidencia
  y habilitar al productor documental antes de probarla con las operaciones.
