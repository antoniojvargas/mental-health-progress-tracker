import { useCallback, useEffect, useState } from 'react';
import { logsApi } from '../services/logs.api.js';
import type { DailyLog } from '../types/daily-log.js';

export type RangeMode = 'week' | 'month';

function rangeFor(mode: RangeMode): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (mode === 'week' ? 7 : 30));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function useLogs(mode: RangeMode) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeFor(mode);
      const res = await logsApi.list(from, to);
      setLogs(res.data);
    } catch {
      setError('No pudimos cargar tus registros. Intenta de nuevo en un momento.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const mergeLog = useCallback((incoming: DailyLog) => {
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.logDate === incoming.logDate);
      if (idx === -1) {
        return [...prev, incoming].sort((a, b) => a.logDate.localeCompare(b.logDate));
      }
      const next = [...prev];
      next[idx] = incoming;
      return next;
    });
  }, []);

  return { logs, loading, error, refetch, mergeLog };
}
