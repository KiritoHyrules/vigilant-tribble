# Contribuir a TRASU

Mantener los cambios acotados y verificables. El frontend vive en `frontend/`;
el futuro backend se incorporará en `backend/` con configuración independiente.
Por ahora, preservar el carácter de demostración de la aplicación y su
integración existente con Figma.

## Organización del código

- Reutilizar los componentes de `frontend/src/components/` antes de duplicar controles.
- Colocar las pantallas de flujo en `frontend/src/views/` y los catálogos demo en `frontend/src/data/`.
- Definir tipos compartidos sin dependencias visuales en `frontend/src/types/`.
- No mover archivos únicamente para crear más carpetas: cada separación debe
  aclarar una responsabilidad o eliminar una dependencia innecesaria.
- Mantener las pruebas junto al cambio funcional y actualizar la documentación
  cuando cambien los comandos o el comportamiento observable.

## Antes de entregar un cambio

Ejecutar las comprobaciones del frontend desde su propia carpeta:

```sh
cd frontend
npm run typecheck
npm run build
npm run test:e2e -- --workers=1 --reporter=line
git diff --check
```

No añadir dependencias del frontend a la raíz. Al desarrollar el backend,
documentar sus requisitos y comprobaciones en `backend/README.md` sin mezclar
sus dependencias con las de `frontend/`.

Para cambios de comportamiento, reproducir primero el problema con una prueba
determinista cuando sea posible y comprobar después que pasa con la corrección.
Una extracción de tipos sin cambios de ejecución se comprueba con TypeScript
y las pruebas de regresión; no requiere inventar un fallo funcional.

Revisar el diff después de usar `npm run format`: el comando modifica archivos.
No mezclar un reformateo global con un cambio funcional acotado.

## Commits

Usar mensajes breves que describan el resultado real, con el formato
`tipo(ámbito): descripción`. Ejemplos:

```text
refactor(frontend): decouple navigation types from UI components
fix(assistance): preserve screen guidance after pausing a task
docs: clarify local setup and demo limitations
```

Cada commit debe tener un propósito coherente y mantener el proyecto verificable.
No incluir dependencias instaladas, compilaciones, trazas, credenciales, datos
institucionales ni capturas privadas. Las cuentas demo documentadas son públicas
y no deben reutilizarse como autenticación real.
