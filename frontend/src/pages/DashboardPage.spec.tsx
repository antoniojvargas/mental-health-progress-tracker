import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage.js';
import { useAuth } from '../hooks/useAuth.js';
import { useLogs } from '../hooks/useLogs.js';
import { useLogSocket } from '../hooks/useLogSocket.js';
import { ToastProvider } from '../components/ui/Toast.js';
import type { DailyLog } from '../types/daily-log.js';

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useLogs.js', () => ({ useLogs: vi.fn() }));
vi.mock('../hooks/useLogSocket.js', () => ({ useLogSocket: vi.fn() }));

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: 'log-1',
    logDate: todayIso(),
    moodRating: 4,
    anxietyLevel: 3,
    stressLevel: 5,
    sleepHours: 7,
    sleepQuality: 4,
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

function mockUseLogs(overrides: Partial<ReturnType<typeof useLogs>> = {}) {
  vi.mocked(useLogs).mockReturnValue({
    logs: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    mergeLog: vi.fn(),
    ...overrides,
  });
}

function renderDashboard() {
  return render(
    <ToastProvider>
      <DashboardPage />
    </ToastProvider>,
  );
}

describe('DashboardPage', () => {
  it('greets the user by their first name', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada Lovelace', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    mockUseLogs();

    renderDashboard();

    expect(screen.getByText('Hola, Ada.')).toBeInTheDocument();
  });

  it('prompts to log today when nothing has been recorded yet', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    mockUseLogs({ logs: [] });

    renderDashboard();

    expect(screen.getByText(/tómate un minuto para registrarlo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar mi día' })).toBeInTheDocument();
  });

  it('shows the adjust-today message once today is already logged', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    mockUseLogs({ logs: [makeLog()] });

    renderDashboard();

    expect(screen.getByText(/ya registraste cómo te sientes hoy/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajustar registro de hoy' })).toBeInTheDocument();
  });

  it('shows a loading skeleton while logs are being fetched', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    mockUseLogs({ loading: true });

    renderDashboard();

    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  it('shows the error message when the logs fetch fails', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    mockUseLogs({ error: 'No pudimos cargar tus registros. Intenta de nuevo en un momento.' });

    renderDashboard();

    expect(screen.getByText(/no pudimos cargar tus registros/i)).toBeInTheDocument();
  });

  it('calls logout when "Salir" is clicked', async () => {
    const logout = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout,
    });
    mockUseLogs();
    const user = userEvent.setup();

    renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Salir' }));

    expect(logout).toHaveBeenCalled();
  });

  it('opens the daily log modal when "Registrar mi día" is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    mockUseLogs();
    const user = userEvent.setup();

    renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Registrar mi día' }));

    expect(screen.getByRole('dialog', { name: '¿Cómo ha sido tu día?' })).toBeInTheDocument();
  });

  it('subscribes to the log socket so the chart updates live', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Ada', avatarUrl: null },
      loading: false,
      logout: vi.fn(),
    });
    mockUseLogs();

    renderDashboard();

    expect(useLogSocket).toHaveBeenCalledWith(expect.any(Function));
  });
});
