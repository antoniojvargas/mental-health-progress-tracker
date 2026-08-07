import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute.js';
import { useAuth } from '../hooks/useAuth.js';

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<p>Login screen</p>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <p>Secret dashboard</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading state while the session is still being checked', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: true, logout: vi.fn() });
    renderProtected();
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('redirects to /login once loading finishes with no user', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderProtected();
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('renders the protected children once a user is present', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    renderProtected();
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
  });
});
