# Decisiones de arquitectura

Este documento explica las decisiones que un checklist no captura: por qué se hizo así y no de
otra forma. El plan completo (con contratos de API paso a paso) vivió primero en modo de
planificación; esto es el resumen que queda en el repo.

## Por qué Express con capas explícitas, no NestJS

Con Express, cada capa (`routes → controller → service → repository`) es una decisión visible en
el código, no una convención impuesta por decoradores de framework. Para un assessment donde se
evalúa "arquitectura backend", eso importa: el revisor ve *tus* decisiones de composición, no las
de Nest. El coste es más disciplina manual (no hay DI automática) — se compensa manteniendo un
único patrón en todos los módulos: `*.routes.ts` monta el router, `*.controller.ts` es el único
lugar con `try/catch` (vía `asyncHandler`, que reenvía al error handler central), `*.service.ts`
lanza `AppError` sin conocer HTTP, `*.repository.ts` es la única capa que toca TypeORM.

## Sesión: cookie httpOnly, no localStorage

Un JWT en `localStorage` es legible por cualquier script que se ejecute en la página — basta una
dependencia npm comprometida. Con datos de salud mental autoreportados, eso no es un detalle
teórico. Una cookie `httpOnly` es invisible para `document.cookie`.

Además, el flujo de OAuth elegido (Authorization Code, server-side) lo exige: el callback de
Google es una navegación del navegador, no un `fetch` que pueda devolver un token a JS. El
backend puede setear una cookie y redirigir; no puede "entregarle" un token a React en ese punto.

`SameSite=Lax` cubre CSRF en las mutaciones (`POST /api/logs`) sin necesitar un token CSRF
adicional para este scope. `Secure` se activa solo con `NODE_ENV=production` (en local es HTTP).

Un solo access token de 7 días, sin refresh token: añadir rotación y revocación de refresh tokens
es complejidad que no aporta nada evaluable en este alcance. Es una decisión, no un olvido.

## `symptoms` como `jsonb`, no tabla normalizada

El array de síntomas siempre se lee y escribe completo junto al log — nunca se consulta "todos los
logs con síntoma X" de forma aislada. Una tabla `symptoms` hija añadiría un join en cada lectura
sin ganar nada a cambio. Postgres indexa y consulta `jsonb` razonablemente bien para este patrón
de acceso; si en el futuro se necesitara analítica por tipo de síntoma, ahí sí justificaría
normalizar.

Las escalas numéricas (`mood_rating`, `anxiety_level`, `stress_level`, `sleep_quality`) son
`smallint` con rango validado en la capa de aplicación (zod), no `ENUM` de Postgres — son valores
que se promedian y grafican, no categorías cerradas. Los campos verdaderamente categóricos
(`activity_type`, `social_frequency`) son `varchar` con el mismo enfoque: el conjunto cerrado vive
en zod, no en el esquema de la base, para no pagar una migración de `ENUM` cada vez que se añade
un valor.

## Migraciones: sin `synchronize`, aplicadas al arrancar

`synchronize: false` en todos los entornos. Las migraciones se escriben a mano (o se generarían
con el CLI de TypeORM contra una base real) y se commitean — nunca se generan en runtime.

`main.ts` corre `dataSource.runMigrations()` antes de levantar el servidor HTTP, para que
`docker compose up` deje la app funcionando de un solo comando. En un sistema productivo real esto
sería un paso de despliegue separado del arranque de la app (para no reintentar migraciones en
cada reinicio de un pod, por ejemplo); aquí es una simplificación deliberada para el alcance de un
assessment, no un descuido.

## Flujo de Google OAuth

Authorization Code server-side, no Google Identity Services en el cliente:

1. `GET /api/auth/google` genera un `state` aleatorio, lo guarda en una cookie httpOnly de 10
   minutos, y redirige a Google.
2. `GET /api/auth/google/callback` valida que el `state` recibido coincide con el de la cookie
   (defensa CSRF del propio flujo), intercambia el `code` por tokens **server-to-server**
   (el `client_secret` nunca sale del backend), y verifica el `id_token` con
   `google-auth-library` (firma, `aud`, `iss`, `exp` — nunca se confía en el payload sin verificar).
3. Upsert del usuario por `sub` (el `googleId`), no por email — el email de una cuenta puede
   cambiar, el `sub` no.
4. Se firma un JWT propio de 7 días y se setea como cookie httpOnly. El token de Google se usa una
   vez para probar identidad y se descarta — no se persiste, porque no se llama a ninguna API de
   Google después del login.

## WebSockets con la misma cookie de sesión

El handshake de Socket.IO parsea la cookie `access_token` y verifica el JWT antes de aceptar la
conexión — no hay un segundo mecanismo de autenticación para el canal en tiempo real. Cada socket
entra en una room `user:<userId>`; los eventos `log:created`/`log:updated` se emiten solo a esa
room, así que un usuario nunca puede recibir, ni por error de broadcast, los datos de otro.

El emisor de eventos se inyecta en el servicio de logs a través de una interfaz
(`LogEventEmitter`), no importando la instancia de Socket.IO directamente — así la capa de dominio
no depende del transporte y se puede testear sin levantar sockets.

## Por qué no hay refresh tokens ni CSRF token explícito

Documentado aquí para que quede claro que son omisiones conscientes: en el alcance de este
assessment, un access token de 7 días y la defensa de `SameSite=Lax` cubren el caso de uso sin
añadir superficie de mantenimiento (rotación de refresh tokens, revocación, tabla de tokens CSRF)
que no se evalúa aquí.

---

# Producción

Decisiones de la fase de production-readiness: testing, Docker, observabilidad, seguridad, CI/CD.

## Retry con backoff y shutdown gracioso

`AppDataSource.initialize()` ya no falla al primer intento — `connect-with-retry.ts` reintenta
con backoff exponencial (capado a 10s, hasta 10 intentos) antes de rendirse. El `docker-compose.yml`
de dev ya gatea el arranque del backend detrás de `postgres: condition: service_healthy`, así que
esto no es para ese caso — es para cuando Postgres se reinicia después de que el backend ya está
corriendo, o para un orquestador sin ese tipo de dependencia explícita entre servicios.

`main.ts` maneja `SIGTERM`/`SIGINT`: deja de aceptar conexiones nuevas, cierra Socket.IO, cierra
el pool de Postgres, con un timeout de 10s de respaldo antes de forzar `process.exit(1)` si algo
se cuelga. Sin esto, un `docker stop` o un redeploy puede cortar conexiones a mitad de una
escritura.

## Logging correlacionado

`pino-http` genera un `X-Request-Id` por request (o reusa el que venga del cliente/proxy), lo
devuelve en la respuesta, y lo incluye en cada línea de log de esa request — incluidas las que se
loguean dentro de un servicio, no solo en el middleware. Cookies y headers de `Authorization` se
redactan explícitamente, incluso en nivel `debug`. En desarrollo el log es legible
(`pino-pretty`); en cualquier otro entorno es JSON puro, que es lo que un agregador de logs
realmente quiere.

## `GET /api/health` verifica Postgres, no solo que el proceso viva

Antes devolvía un literal fijo. Ahora hace `SELECT 1` real contra la base y responde `503` si no
hay respuesta — es lo que el `HEALTHCHECK` de Docker y los smoke tests post-deploy verifican, y
sin el chequeo real un contenedor con la DB caída seguiría reportándose "sano" indefinidamente.

## Secrets: patrón `*_FILE`, no variables de entorno planas en prod

`env.ts` acepta `JWT_SECRET_FILE`, `GOOGLE_CLIENT_SECRET_FILE` y `DATABASE_URL_FILE` como
alternativa a la variable plana — lee el archivo, recorta el contenido, y lo valida igual que
cualquier otro valor. Es el patrón que usan los Docker secrets (montados en `/run/secrets/*`), y
`docker-compose.prod.yml` los usa así: ningún valor sensible vive en una variable de entorno
plana ni en el compose file. En dev, las variables planas de siempre siguen funcionando sin
cambios.

## Docker de producción: por qué el contexto de build es la raíz del repo

`backend/Dockerfile.prod` y `frontend/Dockerfile.prod` construyen con `context: .` (raíz), no
`./backend`/`./frontend` como el compose de dev. La razón: ambos importan tipos desde
`shared/daily-log.d.ts` (ver más abajo), y `tsc` necesita verlo durante el build para
type-checkear — aunque el import se borre por completo del JS compilado, el *build* sí lo lee.
El stage de runtime, en cambio, no necesita `shared/` para nada (nunca aparece en el `dist/`
compilado), así que la imagen final no carga con ese peso.

**Bug real encontrado y corregido en este mismo proceso:** sin un `name:` explícito en
`docker-compose.prod.yml`, Compose deriva el nombre del proyecto del directorio — el mismo
directorio donde vive `docker-compose.yml` (dev). Los dos stacks terminaban compartiendo nombres
de contenedor **y el volumen de Postgres**, así que el backend de prod arrancaba con la
contraseña del volumen ya inicializado por dev, fallando con `password authentication failed`. Y
peor: como ambos compose files construían la imagen `mental-health-progress-tracker-backend:latest`
bajo el mismo tag, el build de producción (que instala solo `--omit=dev`, sin `pino-pretty`)
sobrescribía la imagen que usa dev en modo desarrollo, rompiendo el contenedor de dev hasta la
siguiente reconstrucción explícita. La corrección es `name: mhpt-prod` en
`docker-compose.prod.yml`, que aísla contenedores, red, volumen e imágenes bajo un namespace
propio.

## Migraciones siguen corriendo al arranque, incluso en producción

Ya documentado arriba como decisión consciente para una sola instancia; se mantiene igual en
`docker-compose.prod.yml` porque este deploy es de una sola réplica, no un cluster horizontal. Si
en algún momento se escala a múltiples instancias del backend, esto se vuelve un paso de deploy
separado (un job de migración, no parte del arranque de cada réplica) para que N instancias no
compitan por aplicar la misma migración a la vez.

## E2E: por qué existe `POST /api/auth/test-login`

Playwright puede interceptar tráfico del navegador, pero no las llamadas servidor-a-servidor que
el backend le hace a Google (el intercambio del `code` por tokens) — no hay forma de mockear eso
desde el navegador. La alternativa —scriptear la pantalla de consentimiento real de Google— no es
automatizable de forma confiable y viola los términos de Google.

`POST /api/auth/test-login` (en `auth.controller.ts`) resuelve esto: emite la *misma* cookie de
sesión que el callback real, vía el mismo `jwtService`, pero sin tocar Google. Solo se registra
como ruta si `NODE_ENV==='test'` (un `if` antes de `authRoutes.post(...)` en `auth.routes.ts`) —
en desarrollo o producción, la ruta ni siquiera existe en el binario. El resto del flujo E2E
(dashboard, WebSocket, gráfica) se prueba 100% real a partir de ahí.

## OpenAPI generado desde los schemas de zod, no escrito a mano

`backend/src/core/http/openapi.ts` usa `@asteasolutions/zod-to-openapi` para convertir
`createDailyLogSchema` y `listDailyLogsQuerySchema` (los mismos objetos que `validate()` usa en
producción, `.refine()` incluido) directamente a JSON Schema — nunca se redactó un YAML paralelo
que pudiera desincronizarse del validador real. Servido en `/api/docs` vía `swagger-ui-express`,
con el CSP de Helmet relajado solo en esa ruta (Swagger UI necesita scripts inline; el resto de
la API no).

## Por qué `react-router-dom` sigue con una advertencia `high` de `npm audit`

Es una excepción aceptada, no un descuido: la única versión publicada en `latest` (7.18.2) sigue
marcada por una CSRF bypass en "RSC Mode" — un modo de framework con server actions que esta app
nunca usa (es una SPA clásica con `BrowserRouter`). No existe una versión fija publicada aguas
arriba todavía. El job `audit` de CI corre igual (para no perder visibilidad si cambia), pero con
`continue-on-error: true` solo en esa línea, así no bloquea cada PR por un hallazgo ya evaluado.
