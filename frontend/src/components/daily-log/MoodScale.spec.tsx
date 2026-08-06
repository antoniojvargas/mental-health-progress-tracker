import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoodScale } from './MoodScale.js';

describe('MoodScale', () => {
  it('renders all five mood options as a radio group', () => {
    render(<MoodScale value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: '¿Cómo te sientes hoy?' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('marks the option matching the current value as checked', () => {
    render(<MoodScale value={4} onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Bien' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Muy triste' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the numeric value of the clicked mood', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MoodScale value={null} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /muy bien/i }));

    expect(onChange).toHaveBeenCalledWith(5);
  });
});
