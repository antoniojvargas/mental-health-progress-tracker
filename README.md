# Mental Health Progress Tracker

Aplicación fullstack para que pacientes registren su estado de salud mental diario y visualicen
tendencias semanales/mensuales.

**Stack:** Node.js + TypeScript + Express · PostgreSQL + TypeORM (migraciones, sin `synchronize`)
· React + Vite + Tailwind · Google OAuth 2.0 (Authorization Code, server-side) · Socket.IO ·
Recharts · Docker Compose.

Ver [`docs/architecture.md`](docs/architecture.md) para el detalle de decisiones (esquema de
datos, sesión por cookie httpOnly, migraciones, flujo OAuth, observabilidad, secrets).

---

## Desarrollo

### 1. Credenciales de Google OAuth

1. Ve a [Google Cloud Console → Credenciales](https://console.cloud.google.com/apis/credentials).
2. Crea un **OAuth client ID** de tipo "Web application".
3. En "Authorized redirect URIs" añade: `http://localhost:3000/api/auth/google/callback`
4. Copia el `Client ID` y `Client secret`.

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y rellena `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `JWT_SECRET` (cualquier
cadena aleatoria larga sirve para desarrollo). Ver la [tabla completa de variables](#variables-de-entorno) más abajo.

### 3. Levantar todo

```bash
docker compose up --build
```

Levanta Postgres, corre las migraciones automáticamente al arrancar el backend, y sirve:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (`GET /api/health` — verifica DB, no solo que el proceso viva)
- Documentación de la API (Swagger UI): http://localhost:3000/api/docs

### 4. (Opcional) Poblar datos de ejemplo

Con los contenedores corriendo:

```bash
cd backend
DATABASE_URL="postgresql://mhpt:change-me@localhost:5432/mhpt" npm run db:seed
```

Crea un usuario demo (`demo@mentalhealthtracker.dev`) con 60 días de registros. Para verlo en el
dashboard, inicia sesión con esa cuenta real de Google o adapta el seed a tu propio `googleId`.

### Desarrollo local sin Docker

```bash
# Backend
cd backend && npm install && npm run db:migrate && npm run dev   # http://localhost:3000

# Frontend (otra terminal)
cd frontend && npm install && npm run dev                         # http://localhost:5173
```

### Calidad de código

ESLint + Prettier en ambos paquetes, con un hook de pre-commit (Husky + lint-staged) que corre
`eslint --fix` y `prettier --write` sobre lo que quede staged — instalado automáticamente al
correr `npm install` en la **raíz** del repo (ese `package.json` raíz existe solo para los git
hooks, no es un workspace: `backend/` y `frontend/` siguen siendo paquetes npm independientes).

```bash
npm install            # una vez, en la raíz — instala los git hooks
cd backend && npm run lint && npm run format    # o frontend/
```

---

## Producción

Stack separado del de desarrollo (`docker-compose.prod.yml`): imágenes multi-stage, usuario
non-root, sin bind-mounts, frontend servido por nginx, secrets vía Docker secrets (nunca en el
`.env`).

```bash
cp .env.production.example .env.production   # variables no sensibles — edítalas
# crea los archivos secrets/*.txt — ver secrets/README.md
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

Ver [`secrets/README.md`](secrets/README.md) para qué va en cada archivo de secret, y
[`docs/architecture.md`](docs/architecture.md#producción) para el resto de decisiones (retry de
conexión, shutdown gracioso, por qué las migraciones siguen corriendo al arranque).

---

## Tests

Cuatro capas, cada una con un propósito distinto:

| Capa | Herramienta | Qué cubre |
|---|---|---|
| Unit + integración (backend) | Jest + Supertest, contra Postgres real | Lógica de servicios/repositorios, endpoints completos, la race condition del upsert, rate limiting |
| Unit (frontend) | Vitest + React Testing Library | Lógica pura, hooks, componentes aislados |
| E2E | Playwright, contra el stack real en Docker | El flujo crítico completo: login → crear registro → verlo reflejado **vía WebSocket, sin recargar** → tendencias |
| Smoke | Playwright (`@smoke`), subset rápido | Post-deploy: ¿la API responde?, ¿el frontend sirve?, ¿el WebSocket está vivo? |

### Backend

```bash
docker compose -f docker-compose.test.yml up -d   # Postgres de test, separado del de dev
cd backend
npm test               # tests
npm run test:coverage  # + reporte de cobertura (backend/coverage/index.html), con umbral mínimo
```

### Frontend

```bash
cd frontend
npm test               # tests
npm run test:coverage  # + reporte de cobertura (frontend/coverage/index.html), con umbral mínimo
```

### E2E y smoke

El backend solo registra `POST /api/auth/test-login` (bypass de Google OAuth) cuando
`NODE_ENV=test` — por eso el stack de E2E usa un override de compose en vez del `docker-compose.yml`
normal:

```bash
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
cd e2e
npm install
npx playwright install --with-deps chromium   # una vez
npm test          # suite completa
npm run test:smoke # solo los smoke tests
```

Al terminar, vuelve a levantar el stack normal (`docker compose up -d --build`) para que
`NODE_ENV` vuelva a `development` y el endpoint de test-login deje de existir.

---

## CI/CD

`.github/workflows/ci.yml` corre en cada PR y push a `main`: lint, tests de backend y frontend
(con cobertura), `npm audit`, la suite de Playwright contra el stack completo en Docker, y el
build de ambas imágenes de producción con un smoke-check (usuario non-root, arranca sin
crashear). No publica imágenes a ningún registro.

---

## Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_DB` | Postgres | Credenciales de la base |
| `POSTGRES_PASSWORD` | Postgres (dev) | En prod va como secret, ver abajo |
| `DATABASE_URL` | Backend | Connection string completo |
| `PORT` | Backend | Puerto HTTP (default 3000) |
| `NODE_ENV` | Backend | `development` \| `production` \| `test` — `test` habilita `POST /api/auth/test-login` |
| `LOG_LEVEL` | Backend | `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace` (default `info`) |
| `JWT_SECRET` | Backend | Firma de la cookie de sesión — 16+ caracteres |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Backend | Credenciales OAuth |
| `GOOGLE_REDIRECT_URI` | Backend | Debe coincidir exactamente con lo configurado en Google Cloud Console |
| `FRONTEND_URL` | Backend | Origen permitido por CORS y destino de los redirects de OAuth |
| `VITE_API_URL` | Frontend | Solo informativo en dev (Vite proxea `/api` internamente) |

**Secrets en producción:** `JWT_SECRET`, `GOOGLE_CLIENT_SECRET` y `DATABASE_URL` aceptan además
una variante `*_FILE` (ej. `JWT_SECRET_FILE=/run/secrets/jwt_secret`) que lee el valor de un
archivo — es el patrón que usa `docker-compose.prod.yml` con Docker secrets, para que ningún
valor sensible viva en una variable de entorno plana.

## Scripts útiles (backend)

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga en caliente |
| `npm run build` / `npm start` | Build de producción |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:migrate:revert` | Revierte la última migración |
| `npm run db:seed` | Genera 60 días de registros demo |
| `npm test` / `npm run test:coverage` | Tests de integración (Jest + Supertest) |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` / `npm run format:fix` | Prettier |
