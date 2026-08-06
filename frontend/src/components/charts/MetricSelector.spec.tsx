import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MetricSelector } from './MetricSelector.js';

describe('MetricSelector', () => {
  it('marks currently selected metrics as pressed', () => {
    render(<MetricSelector selected={['mood', 'anxiety']} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ánimo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Estrés' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds a metric when clicked and under the limit of 3', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MetricSelector selected={['mood']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Ansiedad' }));

    expect(onChange).toHaveBeenCalledWith(['mood', 'anxiety']);
  });

  it('removes a metric when an already-selected one is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MetricSelector selected={['mood', 'anxiety']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Ánimo' }));

    expect(onChange).toHaveBeenCalledWith(['anxiety']);
  });

  it('disables unselected metrics once 3 are already selected', () => {
    render(<MetricSelector selected={['mood', 'anxiety', 'stress']} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Horas de sueño' })).toBeDisabled();
  });

  it('still allows deselecting one of the 3 selected metrics', () => {
    render(<MetricSelector selected={['mood', 'anxiety', 'stress']} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Estrés' })).not.toBeDisabled();
  });
});
