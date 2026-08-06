# Mental Health Progress Tracker

Aplicación fullstack para que pacientes registren su estado de salud mental diario y visualicen
tendencias semanales/mensuales. Construida como assessment técnico, con foco en arquitectura
backend limpia sin descuidar el frontend.

**Stack:** Node.js + TypeScript + Express · PostgreSQL + TypeORM (migraciones, sin `synchronize`)
· React + Vite + Tailwind · Google OAuth 2.0 (Authorization Code, server-side) · Socket.IO ·
Recharts · Docker Compose.

Ver [`docs/architecture.md`](docs/architecture.md) para el detalle de decisiones (esquema de
datos, sesión por cookie httpOnly, migraciones, flujo OAuth).

## Arranque en un comando

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
cadena aleatoria larga sirve para desarrollo).

### 3. Levantar todo

```bash
docker compose up --build
```

Esto levanta Postgres, corre las migraciones automáticamente al arrancar el backend, y sirve:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (`GET /api/health` para comprobar que está vivo)

### 4. (Opcional) Poblar datos de ejemplo

Con los contenedores corriendo:

```bash
cd backend
DATABASE_URL="postgresql://mhpt:change-me@localhost:5432/mhpt" npm run db:seed
```

Esto crea un usuario demo (`demo@mentalhealthtracker.dev`) con 60 días de registros. Para verlo
en el dashboard necesitas iniciar sesión con esa cuenta real de Google o adaptar el seed a tu
propio `googleId` una vez hayas iniciado sesión la primera vez.

## Desarrollo local sin Docker

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run dev          # http://localhost:3000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev           # http://localhost:5173
```

## Tests

### Backend

Tests de integración (Jest + Supertest) contra un Postgres real, separado del de desarrollo:

```bash
docker compose -f docker-compose.test.yml up -d
cd backend
npm test              # tests
npm run test:coverage # tests + reporte de cobertura (backend/coverage/index.html)
```

### Frontend

Tests unitarios (Vitest + React Testing Library) sobre lógica pura, servicios y componentes:

```bash
cd frontend
npm test              # tests
npm run test:coverage # tests + reporte de cobertura (frontend/coverage/index.html)
```

## Scripts útiles (backend)

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga en caliente |
| `npm run build` / `npm start` | Build de producción |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:migrate:revert` | Revierte la última migración |
| `npm run db:seed` | Genera 60 días de registros demo |
| `npm test` | Tests de integración (Jest + Supertest) |
