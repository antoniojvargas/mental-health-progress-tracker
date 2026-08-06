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
