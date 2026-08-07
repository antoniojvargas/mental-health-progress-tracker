export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ErrorResponseBody {
  error?: { code?: string; message?: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  // Response.json() is typed Promise<any> by the DOM lib — this cast is the one place that
  // boundary gets crossed, into a shape we actually expect back from our own API.
  const body = (await res.json().catch(() => null)) as ErrorResponseBody | T | null;

  if (!res.ok) {
    const error = (body as ErrorResponseBody | null)?.error;
    throw new ApiError(res.status, error?.code ?? 'UNKNOWN_ERROR', error?.message ?? 'Request failed');
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
};
