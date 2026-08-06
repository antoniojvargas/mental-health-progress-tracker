import { apiClient } from './api-client.js';
import type { CreateDailyLogInput, DailyLog } from '../types/daily-log.js';

export interface ListLogsResponse {
  data: DailyLog[];
  meta: { from: string; to: string; count: number };
}

export const logsApi = {
  create: (input: CreateDailyLogInput) => apiClient.post<DailyLog>('/logs', input),
  list: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return apiClient.get<ListLogsResponse>(`/logs${query ? `?${query}` : ''}`);
  },
  today: () => apiClient.get<DailyLog | null>('/logs/today'),
};
