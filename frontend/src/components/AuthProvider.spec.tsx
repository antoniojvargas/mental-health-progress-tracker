import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider.js';
import { useAuth } from '../hooks/useAuth.js';
import { apiClient, ApiError } from '../services/api-client.js';

vi.mock('../services/api-client.js', async () => {
  const actual = await vi.importActual<typeof import('../services/api-client.js')>('../services/api-client.js');
  return { ...actual, apiClient: { get: vi.fn(), post: vi.fn() } };
});

function Consumer() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>{user ? `Hola, ${user.name}` : 'Sin sesión'}</p>
      <button onClick={() => logout()}>Salir</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
  });

  it('shows a loading state while checking the session, then the signed-in user', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      name: 'Ada Lovelace',
      avatarUrl: null,
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByText('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Hola, Ada Lovelace')).toBeInTheDocument());
  });

  it('treats a 401 from /auth/me as "no session" without surfacing an error', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'Unauthorized'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('Sin sesión')).toBeInTheDocument());
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('logs unexpected (non-401) failures instead of silently swallowing them', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('server exploded'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('Sin sesión')).toBeInTheDocument());
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('clears the user after logout', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null });
    vi.mocked(apiClient.post).mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('Hola, Ada')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Salir' }));

    await waitFor(() => expect(screen.getByText('Sin sesión')).toBeInTheDocument());
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });
});
