# Entrega — TRASU

## Figma

**La evolución visual y el acompañamiento del 8 de noviembre están verificados
en la copia local; todavía no se han sincronizado con la capa remota.** El recibo
que figura debajo corresponde a la importación anterior.

[Abrir versión nueva](https://www.figma.com/design/WIf2KQt9xsmt8n31Ho2dY1/TRASU-INTERFACE?node-id=70-3&autoplay-code-preview=70-3)

- Nueva capa: **TRASU — Presentación, acceso y asistencia**, nodo `70:3`.
- Original conservado: **TRASU — Base Visual**, nodo `6:3`.
- Importación confirmada: `imported`.
- Recibo: seed `2bf1e1112148eba5f8b56d87ffc95b7ca5c84f337d128defb86d0dd34fdeeb08`.
- Código importado como una nueva capa interactiva, no como frames nativos.
- Vista previa en Figma: **no verificada por el importador**. Abrir la capa
  inicia su instalación/vista previa. No se ha publicado un sitio externo.

## Por hacer — estado

### Ampliación: orientación visible por pantalla

- Catálogo local exhaustivo de **22 contextos**: siete módulos y quince subflujos.
- Entrada «Explorar esta pantalla»; si se activa, continúa al abrir detalle,
  documentos u otro contexto. No se activa por visitar una pantalla.
- «Conocer esta pantalla» sigue disponible en una guía activa, pausada o finalizada.
- 24/24 pruebas de la ampliación correctas en escritorio/móvil; 6/6 de regresión
  focal correctas (portada, acompañamiento y reflujo/colores forzados).
- `npm run build` final correcto; detector UI `[]`.
- Revisión independiente: `ship` para el cierre del hueco de descubribilidad en
  pausa/finalización. No es una revisión integral de todos los estados.
- Una regresión global de 70 casos se interrumpió: colisión de archivos de traza
  entre ejecuciones y límite de tiempo. El caso afectado de portada se repitió
  correctamente con salida aislada. **No se afirma 70/70 ni 74/74 en una ejecución
  final completa.** Las 50/50 de la sección siguiente pertenecen al rediseño previo.
- Capturas adicionales: `screen-orientation-{desktop,mobile}.png` y
  `companion-paused-{desktop,mobile}.png` dentro de `.impeccable/review/`.

Detalle: [`docs/screen-assistance.md`](docs/screen-assistance.md). El catálogo
exhaustivo no sustituye el recorrido manual de cada combinación de datos y estado.

- [x] Revisar la aplicación existente y conservar sus fuentes.
- [x] Confirmar portada pública dirigida al personal y dirección institucional.
- [x] Crear presentación, acceso demostrativo y salida.
- [x] Mantener los siete perfiles y sus módulos existentes.
- [x] Añadir recorridos opcionales, repetibles y diferenciados por perfil.
- [x] Añadir ayuda contextual y quince guías filtradas por rol.
- [x] Probar escritorio, móvil y flujos de teclado nuevos.
- [x] Corregir devolución de foco al cerrar un recorrido repetido.
- [x] Importar versión separada en Figma y comprobar que el original continúa.
- [ ] Abrir y revisar la vista previa remota de la nueva capa en Figma.
- [x] Refinar navegación, jerarquía, tablas y formularios del espacio de trabajo.
- [x] Sustituir ayuda repetida por acompañamiento opcional, pausa y localización.
- [x] Verificar que «Mostrar en pantalla» enfoca sin ejecutar operaciones.
- [x] Hacer descubrible la orientación dentro de cada módulo y subflujo.
- [ ] Sincronizar el rediseño local con la capa interactiva de Figma.

## Comprobaciones locales

- TypeScript `tsc --noEmit` y `vite build`: correctos sobre la versión final.
  Un intento mediante npm agotó su tiempo; ambos comandos se verificaron después
  directamente, sin modificar la configuración.
- `npm run test:e2e -- --workers=1 --reporter=line`: **50/50** correctas en Chrome,
  25 en escritorio y 25 en móvil; incluye prueba adicional a 320 px.
- Axe: sin infracciones en los estados analizados por las pruebas.
- Detector Impeccable sobre los archivos UI cambiados: `[]`.
- Revisión independiente: **ship** para seis capturas y fuentes acotadas del
  espacio de trabajo, detalle y acompañamiento. No certifica otras pantallas.
- Capturas: `.impeccable/review/workspace-{desktop,mobile}.png`,
  `detail-{desktop,mobile}.png` y `guided-{desktop,mobile}.png`.
- Observación menor: algunos valores seleccionados se abrevian visualmente en
  controles estrechos en móvil; siguen disponibles en sus selectores.

Límites: las comprobaciones automáticas no certifican WCAG integral; los módulos
originales no recibieron una auditoría exhaustiva. El build conserva un aviso de
compatibilidad futura del cargador de configuración de Vite del proyecto original.
No se implementó autenticación real, conexión a servicios institucionales ni nuevas
atribuciones. La guía no ejecuta tareas de negocio ni modifica sus estados.
