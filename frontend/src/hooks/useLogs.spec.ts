import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLogs, type RangeMode } from './useLogs.js';
import { logsApi } from '../services/logs.api.js';
import type { DailyLog } from '../types/daily-log.js';

vi.mock('../services/logs.api.js', () => ({
  logsApi: { list: vi.fn() },
}));

function makeLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: 'log-1',
    logDate: '2026-08-01',
    moodRating: 3,
    anxietyLevel: 4,
    stressLevel: 5,
    sleepHours: 7,
    sleepQuality: 3,
    sleepDisturbances: [],
    activityType: null,
    activityMinutes: null,
    socialFrequency: 'occasional',
    symptoms: [],
    notes: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('useLogs', () => {
  beforeEach(() => {
    vi.mocked(logsApi.list).mockReset();
  });

  it('fetches logs for the given range on mount and exposes them once loaded', async () => {
    vi.mocked(logsApi.list).mockResolvedValue({
      data: [makeLog()],
      meta: { from: '2026-07-30', to: '2026-08-06', count: 1 },
    });

    const { result } = renderHook(() => useLogs('week'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('requests a 7-day range for "week" and a 30-day range for "month"', async () => {
    vi.mocked(logsApi.list).mockResolvedValue({ data: [], meta: { from: '', to: '', count: 0 } });

    const { result, rerender } = renderHook(({ mode }) => useLogs(mode), {
      initialProps: { mode: 'week' as RangeMode },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const [weekFrom, weekTo] = vi.mocked(logsApi.list).mock.calls[0] as [string, string];
    const weekDays = (new Date(weekTo).getTime() - new Date(weekFrom).getTime()) / 86_400_000;
    expect(weekDays).toBe(7);

    rerender({ mode: 'month' });
    await waitFor(() => expect(vi.mocked(logsApi.list).mock.calls.length).toBeGreaterThan(1));

    const [monthFrom, monthTo] = vi.mocked(logsApi.list).mock.calls.at(-1) as [string, string];
    const monthDays = (new Date(monthTo).getTime() - new Date(monthFrom).getTime()) / 86_400_000;
    expect(monthDays).toBe(30);
  });

  it('surfaces a friendly error message and stops loading when the fetch fails', async () => {
    vi.mocked(logsApi.list).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useLogs('week'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toMatch(/no pudimos cargar/i);
    expect(result.current.logs).toEqual([]);
  });

  it('mergeLog inserts a new log in date order', async () => {
    vi.mocked(logsApi.list).mockResolvedValue({
      data: [makeLog({ logDate: '2026-08-01' }), makeLog({ logDate: '2026-08-03' })],
      meta: { from: '', to: '', count: 2 },
    });

    const { result } = renderHook(() => useLogs('week'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.mergeLog(makeLog({ logDate: '2026-08-02', moodRating: 5 }));
    });

    expect(result.current.logs.map((l) => l.logDate)).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
  });

  it('mergeLog replaces an existing log for the same date instead of duplicating it', async () => {
    vi.mocked(logsApi.list).mockResolvedValue({
      data: [makeLog({ logDate: '2026-08-01', moodRating: 2 })],
      meta: { from: '', to: '', count: 1 },
    });

    const { result } = renderHook(() => useLogs('week'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.mergeLog(makeLog({ logDate: '2026-08-01', moodRating: 5 }));
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].moodRating).toBe(5);
  });
});
