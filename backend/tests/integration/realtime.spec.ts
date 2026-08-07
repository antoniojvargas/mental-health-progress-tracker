import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createSocketServer } from '../../src/realtime/socket-server.js';
import { createSocketLogEmitter } from '../../src/realtime/log-events.js';
import { setLogEventEmitter } from '../../src/modules/daily-log/daily-log.service.js';
import { createTestUser } from '../helpers/build-app.js';
import type { Server as SocketIoServer } from 'socket.io';

function validLog(logDate: string) {
  return {
    logDate,
    moodRating: 4,
    anxietyLevel: 3,
    stressLevel: 5,
    sleepHours: 7,
    sleepQuality: 4,
    sleepDisturbances: [],
    activityType: null,
    activityMinutes: null,
    socialFrequency: 'occasional',
    symptoms: [],
    notes: null,
  };
}

function yesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function waitForConnect(client: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once('connect', () => resolve());
    client.once('connect_error', reject);
    client.connect();
  });
}

describe('realtime updates', () => {
  let httpServer: HttpServer;
  let io: SocketIoServer;
  let app: ReturnType<typeof createApp>;
  let baseUrl: string;

  beforeAll(async () => {
    app = createApp();
    httpServer = createServer(app);
    io = createSocketServer(httpServer);
    setLogEventEmitter(createSocketLogEmitter(io));

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  function connectClient(cookie?: string): ClientSocket {
    return ioClient(baseUrl, {
      transports: ['websocket'],
      extraHeaders: cookie ? { Cookie: cookie } : undefined,
      autoConnect: false,
    });
  }

  it('rejects a socket handshake without a valid session cookie', async () => {
    const client = connectClient();
    const error: Error = await new Promise((resolve) => {
      client.once('connect_error', resolve);
      client.connect();
    });
    expect(error.message).toBe('Unauthorized');
    client.disconnect();
  });

  it('accepts the handshake with a valid session cookie', async () => {
    const { cookie } = await createTestUser();
    const client = connectClient(cookie);
    await waitForConnect(client);
    expect(client.connected).toBe(true);
    client.disconnect();
  });

  it('broadcasts log:created only to the room of the user who owns the log', async () => {
    const owner = await createTestUser();
    const bystander = await createTestUser();

    const ownerClient = connectClient(owner.cookie);
    const bystanderClient = connectClient(bystander.cookie);
    await Promise.all([waitForConnect(ownerClient), waitForConnect(bystanderClient)]);

    const logDate = yesterday();
    const ownerReceived = new Promise<{ logDate: string }>((resolve) =>
      ownerClient.once('log:created', resolve),
    );
    const bystanderReceivedAnything = new Promise<boolean>((resolve) => {
      bystanderClient.once('log:created', () => resolve(true));
      setTimeout(() => resolve(false), 500);
    });

    await request(httpServer).post('/api/logs').set('Cookie', owner.cookie).send(validLog(logDate));

    const [ownerEvent, bystanderGotIt] = await Promise.all([ownerReceived, bystanderReceivedAnything]);

    expect(ownerEvent.logDate).toBe(logDate);
    expect(bystanderGotIt).toBe(false);

    ownerClient.disconnect();
    bystanderClient.disconnect();
  });
});
