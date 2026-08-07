import type { Server as HttpServer } from 'node:http';
import { Server, type DefaultEventsMap } from 'socket.io';
import cookie from 'cookie';
import { env } from '../core/config/env.js';
import { jwtService, SESSION_COOKIE_NAME } from '../modules/auth/jwt.service.js';
import { userRoom } from './log-events.js';

interface SocketData {
  userId: string;
}

type AppSocketServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

export function createSocketServer(httpServer: HttpServer): AppSocketServer {
  const io: AppSocketServer = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie;
    const token = rawCookie ? cookie.parse(rawCookie)[SESSION_COOKIE_NAME] : undefined;
    const payload = token ? jwtService.verify(token) : null;

    if (!payload) {
      next(new Error('Unauthorized'));
      return;
    }

    socket.data.userId = payload.sub;
    next();
  });

  io.on('connection', (socket) => {
    // join() resolves asynchronously to support adapters (e.g. Redis) that coordinate room
    // membership across processes — the in-memory adapter used here settles it synchronously,
    // so there's nothing meaningful to await.
    void socket.join(userRoom(socket.data.userId));
  });

  return io;
}
