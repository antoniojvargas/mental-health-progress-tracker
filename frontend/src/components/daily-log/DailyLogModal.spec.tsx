import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DailyLogModal } from './DailyLogModal.js';
import { ToastProvider } from '../ui/Toast.js';
import { logsApi } from '../../services/logs.api.js';

vi.mock('../../services/logs.api.js', () => ({
  logsApi: { create: vi.fn() },
}));

function renderModal(props: Partial<React.ComponentProps<typeof DailyLogModal>> = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <ToastProvider>
      <DailyLogModal open onClose={onClose} onSaved={onSaved} initialLog={null} {...props} />
    </ToastProvider>,
  );
  return { onClose, onSaved };
}

describe('DailyLogModal', () => {
  beforeEach(() => {
    vi.mocked(logsApi.create).mockReset();
  });

  it('opens on step 1 (Ánimo) showing the mood scale', () => {
    renderModal();
    expect(screen.getByText(/Paso 1 de 4/)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: '¿Cómo te sientes hoy?' })).toBeInTheDocument();
  });

  it('disables "Atrás" on the first step', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeDisabled();
  });

  it('advances through all 4 steps via "Siguiente" and shows the sleep step next', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(screen.getByText(/Paso 2 de 4/)).toBeInTheDocument();
    expect(screen.getByText('Horas de sueño')).toBeInTheDocument();
  });

  it('goes back a step when "Atrás" is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Atrás' }));

    expect(screen.getByText(/Paso 1 de 4/)).toBeInTheDocument();
  });

  it('lets the user submit from any step via "Guardar ahora", not just the last one', async () => {
    vi.mocked(logsApi.create).mockResolvedValue({} as never);
    const user = userEvent.setup();
    const { onSaved, onClose } = renderModal();

    // Still on step 1 (Ánimo) — only mood is required per the daily-log design.
    await user.click(screen.getByRole('button', { name: 'Guardar ahora' }));

    await waitFor(() => expect(logsApi.create).toHaveBeenCalledTimes(1));
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/gracias por tomarte el tiempo/i);
  });

  it('submits the default form values when the user picks a mood and finishes', async () => {
    vi.mocked(logsApi.create).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('radio', { name: 'Muy bien' }));
    await user.click(screen.getByRole('button', { name: 'Guardar ahora' }));

    await waitFor(() => expect(logsApi.create).toHaveBeenCalledTimes(1));
    expect(logsApi.create).toHaveBeenCalledWith(expect.objectContaining({ moodRating: 5, socialFrequency: 'occasional' }));
  });

  it('shows an error toast and keeps the modal open when saving fails', async () => {
    vi.mocked(logsApi.create).mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    const { onSaved, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Guardar ahora' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/no pudimos guardar/i);
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows "Finalizar" instead of "Siguiente" on the last step', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(screen.getByText(/Paso 4 de 4/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
  });
});
