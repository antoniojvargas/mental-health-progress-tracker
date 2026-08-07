import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage.js';
import { useAuth } from '../hooks/useAuth.js';

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('shows the Google login link when there is no session', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderAt('/login');
    expect(screen.getByRole('link', { name: /continuar con google/i })).toHaveAttribute(
      'href',
      '/api/auth/google',
    );
  });

  it('does not show the error banner without an ?error= param', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderAt('/login');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error banner when redirected back with ?error=auth_failed', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderAt('/login?error=auth_failed');
    expect(screen.getByRole('alert')).toHaveTextContent(/no pudimos completar el inicio de sesión/i);
  });

  it('redirects to /dashboard once a session is already present', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    renderAt('/login');
    expect(screen.getByText('Dashboard screen')).toBeInTheDocument();
  });

  it('stays on the login screen while the session is still loading, even with a user', () => {
    // Guards against a flash-redirect before the initial /auth/me check resolves.
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: true,
      logout: vi.fn(),
    });
    renderAt('/login');
    expect(screen.queryByText('Dashboard screen')).not.toBeInTheDocument();
  });
});
