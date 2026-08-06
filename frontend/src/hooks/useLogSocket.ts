import { useEffect } from 'react';
import { getSocket } from '../services/socket-client.js';
import type { DailyLog } from '../types/daily-log.js';

export function useLogSocket(onLog: (log: DailyLog) => void) {
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const handle = (log: DailyLog) => onLog(log);
    socket.on('log:created', handle);
    socket.on('log:updated', handle);

    return () => {
      socket.off('log:created', handle);
      socket.off('log:updated', handle);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
