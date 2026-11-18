# Asistencia operacional TRASU — diseño aprobado

El usuario aprobó ampliar la asistencia por acción y por tarea completa a todos
los módulos y perfiles, preservando la identidad institucional. Modo: Operate /
Read. No se rediseña la portada ni se inventan procedimientos o atribuciones.

## Contrato de interacción

1. Contexto exacto: siete módulos y quince flujos de `App.tsx`, sin recurrir
   al consejo del listado cuando se abre un detalle o formulario.
2. Ayuda al punto de uso: el acompañante opcional localiza y enfoca controles
   existentes con «Mostrar en pantalla», sin pulsarlos. Se retiraron los
   desplegables «Qué ocurre» repetidos por cada botón de las tablas.
   Además, cada contexto ofrece «Explorar esta pantalla»: orientación local por
   elementos disponibles, sin depender de que se encuentre una guía global.
3. Centro de ayuda: catálogo filtrado por perfil, pantalla y búsqueda; cada guía
   incluye entrada, pasos, resultados esperados, alternativas y retorno.
4. Acompañamiento: mantener una guía abierta junto al trabajo, sin bloquearlo ni
   accionar controles. Se puede pausar o cerrar. Reconocer la pantalla siguiente
   no certifica una operación; los pasos de comprobación siguen siendo manuales.
   No se guardan borradores ni datos de expedientes.
5. Seguridad de navegación: consultar/abrir/cerrar ayuda conserva campos. Ir a
   otro módulo desde una guía exige advertir si se abandona un formulario.
6. Roles: Vocal solo reconoce el acceso condicionado; Soporte registra únicamente
   simulaciones. No se propone cambiar de rol como forma de eludir restricciones.

## Cobertura de tareas

- Listado → Ver expediente → contexto/responsable → documentos/seguimiento → volver.
- Buscar → sin resultados/restricción → ajustar/restaurar demo → detalle → retornar.
- Supervisor: expediente sin responsable → asignación → confirmar/cancelar; solicitud
  pendiente → aprobar/rechazar → resultado → bandeja.
- Analista: solicitar reasignación sin cambiar responsabilidad; versión exacta →
  envío → revisión interna; observada → atención → nueva versión → nuevo envío.
- Revisor: tarea → identidad → observar/conformidad → confirmar → resultado.
- Documentario: salida → validación → confirmación local → detalle; fallo o resultado
  incierto → reintento/escalamiento → historial preservado.
- Analista/documentario: derivación especial → constancia → registro interno.
- Auditor: filtros → actuación → evidencia disponible/no disponible → expediente.
- Soporte: intervención → actuación → resultado → evidencia si recuperación comprobada.

## Calidad y aceptación

WCAG 2.2 AA como objetivo comprobable: semántica, contraste, teclado, foco,
reflujo a 320 CSS px, nombres/errores relacionados, ayuda consistente. Matriz de
evidencia separada; no afirmar certificación mediante axe. ISO 9241-110:2020 se
operacionaliza con tareas, autodescripción, expectativas, aprendizaje, control,
robustez ante errores y participación sin distracciones. Texto íntegro de ISO no
disponible localmente: no se atribuyen cláusulas específicas sin verificación.

Pruebas: destinos y ramas reales, ayuda que no borra formularios ni modifica
registros, permisos, teclado/foco/diálogos, escritorio/móvil/reflujo y axe. Revisar
capturas de pantalla y casos completos, no solo que existan componentes.

## Plan de ejecución

- [x] Releer fuentes y trazar navegación, estados y confirmaciones.
- [x] Crear catálogo tipado de contextos, acciones y guías completas.
- [x] Integrar ayuda contextual y acompañamiento sin reemplazar reglas de negocio.
- [x] Corregir barreras de teclado/semántica encontradas en los flujos cubiertos.
- [x] Ampliar pruebas y documentar evidencia/limitaciones normativas.
- [ ] Verificar visualmente y entregar otra capa Figma preservando las anteriores.

Proyecto recuperado sin repositorio Git: no se crean commits ni se inicializa Git
como efecto lateral. CodeGraph no disponible para este proyecto; inventario leído
en fuente. No se afirma cobertura de índice.

Actualización del 8 de noviembre: 50/50 pruebas correctas. Matriz de evidencia
en `interaction-evidence.md`; capturas y límites de entrega en `../DELIVERY.md`.

La ampliación de orientación local por los 22 contextos se documenta en
`screen-assistance.md`. La bienvenida por perfil no sustituye estos recorridos.
