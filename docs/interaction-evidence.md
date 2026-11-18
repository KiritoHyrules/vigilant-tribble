# TRASU — evidencia de interacción y accesibilidad

Estado: 8 de noviembre de 2026. Objetivo WCAG 2.2 AA; diseño informado por
ISO 9241-110:2020. **No es declaración de conformidad ni certificación.**

## Resultado verificable

**Ampliación posterior:** orientación local en los 22 contextos, 24/24 pruebas
específicas y 6/6 de regresión focal correctas. Build final correcto; el intento
global de 70 casos quedó incompleto por artefactos compartidos y tiempo. No se
presenta como ejecución íntegra correcta. El resultado de 50/50 siguiente
corresponde a la etapa de rediseño anterior.

- TypeScript sin errores y compilación Vite completada.
- 50/50 pruebas Playwright: 25 escritorio y 25 móvil; incluye escenario a 320px.
- Axe sin infracciones en los estados efectivamente analizados en esas pruebas.
- Detector Impeccable: `[]` para los archivos UI revisados.
- Revisión independiente: `ship` para seis capturas y las fuentes acotadas. La
  revisión no ejecutó pruebas ni evaluó todas las pantallas del prototipo.

## WCAG: relación entre criterio, decisión y evidencia

| Criterio | Decisión aplicada | Evidencia y alcance |
|---|---|---|
| 1.3.1 Información y relaciones | Etiquetas de campo asociadas; tablas y regiones con nombre | `system.tsx`; axe y pruebas de formulario |
| 1.4.3 Contraste mínimo | Texto secundario oscurecido; paleta y estados con texto | Axe en estados cubiertos; no todas las combinaciones posibles |
| 1.4.10 Reflujo | Filtros envuelven; detalle apilado; guía sin superposición | Prueba a 320px y capturas a 390px. Tablas conservan desplazamiento bidimensional cuando es necesario |
| 2.1.1 Teclado | Controles nativos; resaltar/enfocar sin activar | `design.spec.ts`; formularios y diálogos en `workflows.spec.ts` |
| 2.4.3 Orden del foco | Restitución tras modal, sin volver a un nodo reutilizado para otra acción | Aprobación, rechazo y cancelación probados |
| 2.4.7 Foco visible | Contorno explícito; colores forzados | Prueba de foco con teclado y emulación de contraste forzado |
| 2.4.11 Foco no oculto (mínimo) | Acompañante en el flujo, no sobre controles; localización por desplazamiento | Capturas y prueba de localización. Pendiente recorrido manual exhaustivo de todos los elementos |
| 2.5.8 Tamaño del objetivo (mínimo) | Botones habituales de 40px y navegación de 48px de alto | Regla AA: 24×24px o sus excepciones de espaciado; no se afirma que 44px sea el mínimo AA |
| 3.2.6 Ayuda consistente | Entrada de ayuda en la cabecera en los módulos | Pruebas de siete perfiles. No obliga a introducir ayuda en cada botón |
| 3.3.1 / 3.3.3 Errores y sugerencias | Mensaje asociado, datos preparados conservados al consultar ayuda | Revisión, solicitud, subsanación y registro técnico probados |
| 4.1.2 Nombre, función y valor | Selectores con nombre y botones colapsados identificables | Axe en estados cubiertos; nombres estables al aparecer errores |

La aplicación es demo: no se deduce conformidad de una autenticación institucional
que no existe. La portada permite completar datos de prueba y no solicita
credenciales reales. No se introducen restricciones de copiar/pegar.

La orientación local añade una entrada común en cada contexto, sin exigir abrir
el centro de ayuda. Los puntos se filtran por elementos presentes y disponibles;
el catálogo cubre todos los IDs de pantalla, no prueba cada combinación de estado.

## ISO: principios llevados a interacción

Estas relaciones son decisiones de diseño, no una reproducción ni auditoría por
cláusulas del texto íntegro de ISO.

| Principio | Manifestación en TRASU |
|---|---|
| Adecuación a la tarea | La lista y las acciones dominan; simulaciones recogidas; asistencia opt-in |
| Autodescripción | Referencias, estados y nombres de acción visibles; explicación adicional bajo demanda |
| Conformidad con expectativas | Misma navegación, formularios y confirmaciones entre módulos |
| Controlabilidad | Iniciar, pausar y cerrar; «Mostrar» no pulsa ni registra; el usuario confirma |
| Aprendizaje | Orientación sobre controles reales; la guía reconoce transiciones de pantalla sin declarar éxito de negocio |
| Robustez frente a errores de uso | Validación, cancelación, recuperación y conservación de versiones/historial |

## Pendientes antes de declarar conformidad

- Auditoría manual de todas las pantallas, estados y confirmaciones relevantes.
- Lectores de pantalla reales (por ejemplo NVDA), zoom y personalizaciones de texto.
- Medición exhaustiva de objetivos, contraste y orden de foco, no solo axe.
- Pruebas con personal institucional: completar tareas, errores, recuperación y
  utilidad del acompañamiento; no sustituirlas por apreciaciones estéticas.
- Validación de procedimientos y del sistema de autenticación cuando exista.
- Sincronización y verificación remota de esta versión en Figma.

## Fuentes

- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI — Novedades y explicación de WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [ISO — ISO 9241-110:2020, Interaction principles](https://www.iso.org/standard/75258.html), ficha oficial; versión confirmada en 2025.
