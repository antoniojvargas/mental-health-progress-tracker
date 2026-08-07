import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLogSocket } from './useLogSocket.js';
import { getSocket } from '../services/socket-client.js';

vi.mock('../services/socket-client.js', () => ({
  getSocket: vi.fn(),
}));

describe('useLogSocket', () => {
  const fakeSocket = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(getSocket).mockReturnValue(fakeSocket as never);
    fakeSocket.connect.mockClear();
    fakeSocket.disconnect.mockClear();
    fakeSocket.on.mockClear();
    fakeSocket.off.mockClear();
  });

  it('connects and subscribes to both log events on mount', () => {
    renderHook(() => useLogSocket(vi.fn()));

    expect(fakeSocket.connect).toHaveBeenCalledTimes(1);
    expect(fakeSocket.on).toHaveBeenCalledWith('log:created', expect.any(Function));
    expect(fakeSocket.on).toHaveBeenCalledWith('log:updated', expect.any(Function));
  });

  it('invokes the callback when a log:created event arrives', () => {
    const onLog = vi.fn();
    renderHook(() => useLogSocket(onLog));

    const call = fakeSocket.on.mock.calls.find(([event]) => event === 'log:created') as
      [string, (log: unknown) => void] | undefined;
    const fakeLog = { id: '1', logDate: '2026-08-01' };
    call?.[1](fakeLog);

    expect(onLog).toHaveBeenCalledWith(fakeLog);
  });

  it('unsubscribes both events and disconnects on unmount', () => {
    const { unmount } = renderHook(() => useLogSocket(vi.fn()));
    unmount();

    expect(fakeSocket.off).toHaveBeenCalledWith('log:created', expect.any(Function));
    expect(fakeSocket.off).toHaveBeenCalledWith('log:updated', expect.any(Function));
    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
  });
});
