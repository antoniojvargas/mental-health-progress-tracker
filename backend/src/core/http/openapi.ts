import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { createDailyLogSchema, listDailyLogsQuerySchema } from '../../modules/daily-log/daily-log.schema.js';

// Patches ZodType with `.openapi()` — not used below (the existing schemas stay untouched, so
// they keep meaning exactly what the actual validation middleware enforces, with nothing to
// drift), but zod-to-openapi's schema conversion needs this called once before it runs.
extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const SESSION_COOKIE_SCHEME = 'sessionCookie';
registry.registerComponent('securitySchemes', SESSION_COOKIE_SCHEME, {
  type: 'apiKey',
  in: 'cookie',
  name: 'access_token',
});

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()),
  }),
});

const dailyLogResponseSchema = z.object({
  id: z.string().uuid(),
  logDate: z.string(),
  moodRating: z.number(),
  anxietyLevel: z.number(),
  stressLevel: z.number(),
  sleepHours: z.number(),
  sleepQuality: z.number(),
  sleepDisturbances: z.array(z.string()),
  activityType: z.string().nullable(),
  activityMinutes: z.number().nullable(),
  socialFrequency: z.string(),
  symptoms: z.array(z.object({ type: z.string(), severity: z.number() })),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['ops'],
  summary: 'Liveness/readiness check — pings Postgres, not just "is the process up".',
  responses: {
    200: {
      description: 'Healthy',
      content: { 'application/json': { schema: z.object({ status: z.literal('ok'), uptime: z.number() }) } },
    },
    503: {
      description: 'Database unreachable',
      content: {
        'application/json': {
          schema: z.object({ status: z.literal('error'), db: z.literal('unreachable') }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/google',
  tags: ['auth'],
  summary: 'Starts the Google OAuth login flow. Browser navigation, not a fetch/XHR call.',
  responses: { 302: { description: 'Redirect to Google’s consent screen' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/google/callback',
  tags: ['auth'],
  summary: 'Google redirects here after consent. Sets the session cookie on success.',
  request: { query: z.object({ code: z.string(), state: z.string() }) },
  responses: {
    302: {
      description: 'Redirect to the frontend — /dashboard on success, /login?error=auth_failed on failure',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['auth'],
  summary: 'The signed-in user.',
  security: [{ [SESSION_COOKIE_SCHEME]: [] }],
  responses: {
    200: { description: 'Current user', content: { 'application/json': { schema: userResponseSchema } } },
    401: {
      description: 'No valid session',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['auth'],
  summary: 'Clears the session cookie.',
  responses: { 204: { description: 'Logged out' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/logs',
  tags: ['daily-log'],
  summary: 'Create or update today’s (or a past) daily log — upserts on (user, logDate).',
  security: [{ [SESSION_COOKIE_SCHEME]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createDailyLogSchema } } },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: dailyLogResponseSchema } } },
    200: {
      description: 'Updated (a log already existed for that date)',
      content: { 'application/json': { schema: dailyLogResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'No valid session',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    429: { description: 'Rate limited', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/logs',
  tags: ['daily-log'],
  summary:
    'List logs for the signed-in user in a date range (defaults to the last 30 days, max 366), paginated.',
  security: [{ [SESSION_COOKIE_SCHEME]: [] }],
  request: { query: listDailyLogsQuerySchema },
  responses: {
    200: {
      description: 'A page of logs in range',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(dailyLogResponseSchema),
            meta: z.object({
              from: z.string(),
              to: z.string(),
              limit: z.number(),
              offset: z.number(),
              total: z.number(),
            }),
          }),
        },
      },
    },
    400: { description: 'Invalid range', content: { 'application/json': { schema: errorResponseSchema } } },
    401: {
      description: 'No valid session',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/logs/today',
  tags: ['daily-log'],
  summary: 'Today’s log for the signed-in user, or null if nothing was logged yet.',
  security: [{ [SESSION_COOKIE_SCHEME]: [] }],
  responses: {
    200: {
      description: 'Today’s log, or null',
      content: { 'application/json': { schema: dailyLogResponseSchema.nullable() } },
    },
    401: {
      description: 'No valid session',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Mental Health Progress Tracker API',
      version: '1.0.0',
      description:
        'Request/response shapes here are hand-mirrored from the same zod schemas the API ' +
        'actually validates against (see backend/src/modules/daily-log/daily-log.schema.ts) — ' +
        'not a separately hand-written contract that can drift from what the server really does.',
    },
    servers: [{ url: '/api', description: 'Same-origin, relative to wherever this is hosted' }],
  });
}
