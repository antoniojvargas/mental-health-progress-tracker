import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import cookie from 'cookie';
import { env } from '../core/config/env.js';
import { jwtService, SESSION_COOKIE_NAME } from '../modules/auth/jwt.service.js';
import { userRoom } from './log-events.js';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
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
    socket.join(userRoom(socket.data.userId as string));
  });

  return io;
}
