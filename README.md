# TRASU

Repositorio del sistema TRASU, organizado para mantener el frontend y el futuro
backend en el mismo lugar, con dependencias y configuraciones independientes.

Actualmente contiene **TRASU Front**, un prototipo interactivo con React,
TypeScript y Vite. El backend todavía no está implementado: no hay API,
autenticación real ni persistencia institucional.

## Contenido del repositorio

```text
.
├── .env.example
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.md
│   │   └── task.md
│   ├── pull_request_template.md
│   └── workflows/
│       └── frontend-ci.yml
├── .gitignore
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
├── backend/
│   └── README.md
├── compose.yaml
├── contracts/
│   └── README.md
├── docs/
│   ├── architecture.md
│   └── engineering-plan.md
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

## Construcción del backend

El backend se incorporará en `backend/` con dependencias independientes del
frontend. Stack decidido: NestJS, TypeScript, Node 24 LTS, PostgreSQL y TypeORM.
Consultar [arquitectura](docs/architecture.md), [plan técnico](docs/engineering-plan.md),
[contratos](contracts/README.md) y [estado del backend](backend/README.md).
El frontend conserva sus recorridos de demostración sin depender de una API.

### PostgreSQL para desarrollo local

Requiere Docker con Compose. En la raíz, copiar `.env.example` a `.env`
(`Copy-Item .env.example .env` en PowerShell o `cp .env.example .env` en bash)
y definir una contraseña local no reutilizada. No versionar `.env`.

```sh
docker compose config --quiet
docker compose up -d postgres
docker compose ps
docker compose exec postgres pg_isready -U trasu_dev -d trasu_dev
```

Si cambian el usuario o la base, ajustar el último comando. El puerto 5432
solo escucha en loopback; si está ocupado, cambiar `POSTGRES_PORT`.
`docker compose down` detiene el entorno sin borrar el volumen; no agregar `-v`
salvo que se quiera eliminar sus datos. Cambiar la contraseña en `.env` no
actualiza un volumen ya inicializado. Este entorno no es para producción.
El backend y sus migraciones se incorporarán con sus tarjetas.

## Trabajo en equipo

Leer [AGENTS.md](AGENTS.md) antes de utilizar agentes. El tablero GitHub Projects
será el estado operativo de las tareas; el plan técnico es la referencia de
construcción. La CI frontend comprueba instalación reproducible, tipos y
compilación. Las pruebas de navegador siguen siendo obligatorias en local hasta
que se configure y verifique CI e2e. La CI backend se incorporará con BE-002.

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
