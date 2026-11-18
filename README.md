# TRASU

Repositorio del sistema TRASU, organizado para mantener el frontend y el futuro
backend en el mismo lugar, con dependencias y configuraciones independientes.

Actualmente contiene **TRASU Front**, un prototipo interactivo con React,
TypeScript y Vite. El backend todavía no está implementado: no hay API,
autenticación real ni persistencia institucional.

## Contenido del repositorio

```text
.
├── README.md           # Presentación y guía general del repositorio
├── CONTRIBUTING.md     # Convenciones y comprobaciones para contribuir
├── .gitignore          # Exclusiones comunes a los proyectos
└── frontend/           # Aplicación web y toda su configuración
    ├── README.md       # Instalación, comandos, perfiles demo y límites
    ├── package.json
    ├── package-lock.json
    ├── src/            # Componentes, pantallas, datos demo y tipos
    ├── public/         # Recursos estáticos
    ├── tests/          # Pruebas de navegador
    ├── docs/           # Documentación funcional y de diseño del frontend
    ├── scripts/        # Utilidades del frontend
    └── .figma/make/    # Integración existente con Figma
```

Cuando se implemente, el backend se incorporará en `backend/`, al mismo nivel
que `frontend/`, con su propio README, dependencias, configuración y pruebas.
Por ahora no se crean un servicio ficticio ni archivos de configuración para
una tecnología de backend que todavía no se ha elegido.

## Ejecutar el frontend

Requisitos: Node.js compatible con Vite 8 —verificado con Node.js 24— y npm.

```sh
git clone https://github.com/KiritoHyrules/vigilant-tribble.git
cd vigilant-tribble/frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

Abrir <http://127.0.0.1:5178>. Los comandos de npm se ejecutan **dentro de
`frontend/`**, no desde la raíz. No se necesita un backend ni un archivo `.env`
para probar la demostración.

## Comprobar el frontend

Desde `frontend/`:

```sh
npm run typecheck
npm run build
npm run test:e2e -- --workers=1 --reporter=line
```

Las pruebas de navegador requieren Google Chrome. La compilación se genera en
`frontend/dist/`; no se incluye en Git. Para inspeccionarla localmente después
de compilar, ejecutar `npm run preview` desde `frontend/`.

## Documentación

- [Frontend: estructura, ejecución, pruebas y cuentas demo](frontend/README.md).
- [Contribución y commits](CONTRIBUTING.md).
- [Contexto y límites del producto](frontend/PRODUCT.md).
- [Criterios de diseño](frontend/DESIGN.md).

## Alcance y seguridad

Los expedientes, perfiles y operaciones son de demostración. No introducir
contraseñas, credenciales ni datos institucionales reales. La separación de
carpetas prepara el repositorio para evolucionar; no convierte el prototipo
en un sistema listo para producción. Subir código a GitHub no despliega la
aplicación ni ejecuta los scripts de publicación de Figma.
