# Orientación dentro de cada pantalla

La ayuda global no sustituye la orientación local. En cada módulo o subflujo
interno, `Assistance` ofrece **Explorar esta pantalla** sin tener que buscar una
guía en el panel de ayuda. La invitación es compacta: no se abre un tour de oficio.

## Interacción

1. La persona elige explorar; se explica un solo elemento a la vez.
2. **Mostrar el elemento** lo localiza y enfoca; no pulsa ni envía nada.
3. **Siguiente elemento** explica otra zona disponible de la misma pantalla.
4. Al navegar por un control real, la orientación ya activada continúa con los
   puntos de la nueva pantalla, empezando por su contexto.
5. Se puede cerrar con el botón de cierre, al terminar o con Escape. El formulario
   mantiene lo escrito. Escape no interfiere con una confirmación abierta.
6. Mientras existe una guía por tarea, **Conocer esta pantalla** permite cambiar
   a la orientación local. Se sustituye la guía, no se superponen dos recorridos.

## Cobertura declarada

`src/data/screen-tours.ts` es un `Record<ScreenId, ScreenStop[]>`: TypeScript exige
una definición para cada contexto. Son siete módulos y quince subflujos:

| Módulos | Subflujos |
|---|---|
| Pendientes y seguimiento | Detalle del expediente, asignación inicial, solicitud de reasignación |
| Localizar expedientes | Evaluación de solicitud |
| Solicitudes de reasignación | Documentos y versiones, envío a revisión |
| Revisiones pendientes | Revisión de versión, subsanación |
| Intercambios registrados | Detalle de intercambio, registro de salida, tratamiento, derivación especial |
| Evidencia y trazabilidad | Detalle de actuación |
| Intervenciones técnicas | Detalle de intervención, registro técnico |

Las columnas enumeran los contextos; no constituyen una correspondencia de
permisos entre cada fila. Las reglas de negocio siguen en la aplicación original.

## Ejemplo exigido: Ver expediente

- En pendientes, el primer punto explica para qué sirve **Ver expediente** y que
  consultar no modifica datos ni atiende el pendiente.
- Al abrirlo, el detalle ofrece o continúa con **Ya estás dentro del expediente**.
- Los siguientes puntos señalan documentos, seguimiento cuando existe, gestión
  de responsabilidad y retorno al listado.
- Documentos tiene su propia orientación: versiones, inspector y retorno.

## Estados y permisos

Solo se ofrecen puntos con un elemento disponible y visible en el DOM actual.
En un vacío o error se explica el bloque de estado; no se ofrece una fila que no
existe. Una pantalla restringida tiene orientación sobre ese límite, no sobre
operaciones ocultas. Los diálogos abiertos suspenden el resaltado de la página.
La guía nunca habilita permisos ni cambia de perfil.

## Verificación y límites

`tests/screen-assistance.spec.ts` comprueba el catálogo exhaustivo, entradas por
perfil, continuidad pendientes → detalle → documentos, conservación de motivo,
cierre/foco y estados de vacío/error. La prueba de catálogo no equivale a haber
recorrido manualmente cada punto de todas las combinaciones de estado.

Las capturas `screen-orientation-{desktop,mobile}.png` muestran el detalle con la
orientación activada. El resultado global más reciente está en `../DELIVERY.md`.
