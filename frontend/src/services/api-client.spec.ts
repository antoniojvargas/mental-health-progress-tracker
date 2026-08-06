import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from './api-client.js';

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }),
  );
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefixes requests with /api and sends credentials for session cookies', async () => {
    mockFetchOnce(200, { ok: true });

    await apiClient.get('/logs/today');

    expect(fetch).toHaveBeenCalledWith(
      '/api/logs/today',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
  });

  it('resolves with the parsed JSON body on success', async () => {
    mockFetchOnce(200, { id: 'abc' });

    const result = await apiClient.get<{ id: string }>('/logs/today');

    expect(result).toEqual({ id: 'abc' });
  });

  it('returns undefined for a 204 No Content response without parsing a body', async () => {
    const jsonSpy = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204, ok: true, json: jsonSpy }));

    const result = await apiClient.post('/auth/logout');

    expect(result).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('throws an ApiError carrying the server error code and message on failure', async () => {
    mockFetchOnce(400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' } });

    await expect(apiClient.post('/logs', {})).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
    });
  });

  it('falls back to a generic error when the failure body has no error field', async () => {
    mockFetchOnce(500, {});

    await expect(apiClient.get('/logs')).rejects.toBeInstanceOf(ApiError);
    await expect(apiClient.get('/logs')).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' });
  });

  it('sends a JSON-stringified body on POST when data is provided', async () => {
    mockFetchOnce(201, { id: 'new' });

    await apiClient.post('/logs', { moodRating: 4 });

    expect(fetch).toHaveBeenCalledWith(
      '/api/logs',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ moodRating: 4 }) }),
    );
  });
});
