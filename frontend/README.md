# TRASU Front

Frontend de demostración para la gestión y el seguimiento de expedientes de
TRASU. Incluye presentación pública, acceso por perfiles, flujos de trabajo y
asistencia contextual. Desarrollado con React, TypeScript y Vite.

> **Alcance:** es un prototipo interactivo con datos ficticios y operaciones
> locales. No incluye backend, autenticación real ni autorización de producción.
> Publicar el código en GitHub no despliega la aplicación.

## Requisitos

- Node.js compatible con Vite 8; esta entrega se comprobó con Node.js 24.
- npm y las versiones fijadas en `package-lock.json`.
- Google Chrome para las pruebas de navegador: Playwright usa el canal `chrome`.

## Inicio rápido

```sh
git clone https://github.com/KiritoHyrules/vigilant-tribble.git
cd vigilant-tribble/frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

Abrir <http://127.0.0.1:5178>. No se necesitan credenciales institucionales ni
variables de entorno para ejecutar la demostración.

Todas las rutas y los comandos de esta guía son relativos a `frontend/`.
La guía general del repositorio está en el [README principal](../README.md).

## Comandos

| Comando | Propósito |
|---|---|
| `npm run dev` | Iniciar el servidor de desarrollo |
| `npm run typecheck` | Comprobar los tipos de la aplicación |
| `npm run build` | Comprobar los tipos y generar la compilación en `dist/` |
| `npm run preview` | Inspeccionar localmente la compilación generada |
| `npm run test:e2e -- --workers=1 --reporter=line` | Ejecutar las pruebas de escritorio y móvil de forma serial |
| `npm run format` | Aplicar el formateador; modifica archivos |

Las pruebas inician el servidor en el puerto 5178 o reutilizan el existente.
Antes de ejecutarlas, comprobar que cualquier servidor en ese puerto corresponde
a este proyecto. No ejecutar suites simultáneas sobre la misma carpeta.

## Estructura

```text
src/
  main.tsx          # Entrada de React
  Portal.tsx        # Portada, acceso y espacio de trabajo
  App.tsx           # Coordinación de los flujos y del estado demo
  components/       # Componentes visuales y asistencia compartida
  views/            # Pantallas y formularios de cada flujo
  data/             # Datos ficticios, catálogos y modelos del prototipo
  types/            # Tipos compartidos independientes de la interfaz
  *.css             # Estilos de portada y espacio de trabajo
public/             # Recursos estáticos
tests/              # Pruebas Playwright y comprobaciones con axe
docs/               # Documentación funcional y de diseño
scripts/            # Empaquetado para el flujo de Figma
.figma/make/        # Integración utilizada por la configuración de Vite
```

Los catálogos de `src/data/` no dependen de componentes visuales para sus tipos
de navegación: los importan de `src/types/navigation.ts`. `AppShell` conserva
sus exportaciones anteriores por compatibilidad. Se mantiene la organización
actual sin añadir capas ni dependencias innecesarias.

## Acceso de demostración

Todas las cuentas siguientes usan la contraseña pública `trasu-demo`:

| Perfil | Usuario |
|---|---|
| Analista | `demo.analista` |
| Supervisor | `demo.supervisor` |
| Revisor | `demo.revisor` |
| Vocal | `demo.vocal` |
| Personal documentario | `demo.documentario` |
| Soporte | `demo.soporte` |
| Auditor | `demo.auditor` |

No introducir contraseñas ni datos institucionales reales. El selector de perfiles
y los permisos simulados no son mecanismos de seguridad para producción.

## Verificación de esta entrega

- `npm run typecheck`: correcto.
- `npm run build`: correcto.
- Suite Playwright serial: **74 pruebas correctas**, entre escritorio y móvil.

La suite cubre acceso demo, perfiles, orientación contextual y flujos de trabajo.
Las comprobaciones con axe se limitan a los estados probados; no constituyen
una certificación integral de accesibilidad. La primera ejecución se interrumpió
por el límite de tiempo del comando; la ejecución completa posterior terminó
correctamente.

Vite advierte de dos incompatibilidades futuras en su configuración: `__dirname`
y una importación JSON sin atributos. No impiden la compilación actual y no se
modificaron como parte de esta reorganización.

## Documentación y mantenimiento

- [Guía de contribución](../CONTRIBUTING.md): criterios y comprobaciones para cambios.
- [Contexto y límites del producto](PRODUCT.md).
- [Identidad y criterios de diseño](DESIGN.md).
- [Asistencia de pantalla](docs/screen-assistance.md).
- [Evidencia histórica de interacción](docs/interaction-evidence.md).
- [Historial de entregas](DELIVERY.md): resultados anteriores, no sustituyen la
  verificación indicada arriba.

La integración con Figma se conserva: `vite.config.ts` utiliza
`.figma/make/site.json`. Los scripts de publicación de Figma no forman parte del
inicio local ni de la subida del código a GitHub.

Dependencias, compilaciones, resultados de pruebas, archivos de entorno y
evidencias locales de `.impeccable/` quedan fuera de Git. Las capturas citadas
en documentos históricos pueden no estar incluidas en el repositorio.
