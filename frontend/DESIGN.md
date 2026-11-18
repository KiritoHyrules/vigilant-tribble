# Sistema visual de TRASU

Extensión de la identidad existente, no una marca nueva. Autoridad de origen:
`src/index.css`, `src/components/system.tsx` y `src/components/AppShell.tsx`.

- Tipografía: Source Sans 3; conservar la familia y su fallback de sistema.
- Marca: `--color-brand-700: #124b82`, `--color-brand-600: #1762a6`.
- Texto: `--color-ink-950: #17212b`; secundario `--color-ink-600: #536574`.
- Superficies: blanco y `--color-canvas: #f4f6f8`; azul para orientación y acción.
- Radios existentes: 6, 10 y 14 px. No introducir un sistema paralelo.
- Portada: composición amplia, título dominante y recorrido de trabajo abstracto;
  sin estadísticas inventadas, capturas con datos internos ni fotografías decorativas.
- Acceso: formulario legible y distinción explícita entre demo y producción.
- Ayuda: mecanismo en posición consistente, textos breves y contextuales; guías
  filtradas por perfil y recorridos no bloqueantes que no ejecutan operaciones.
- Navegación de teclado, foco visible, reflujo móvil y movimiento reducido.

La implementación original se conserva. Las mejoras nuevas se acotan mediante
`src/portal.css` y `src/workspace.css`; no reemplazar globalmente las reglas de
los módulos existentes. La extensión visual aprobada del espacio de trabajo se
documenta en [`docs/workspace-design.md`](docs/workspace-design.md).
