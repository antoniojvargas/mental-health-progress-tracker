import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SymptomPicker } from './SymptomPicker.js';

describe('SymptomPicker', () => {
  it('does not show a severity picker for an unchecked symptom', () => {
    render(<SymptomPicker symptoms={[]} onChange={vi.fn()} />);
    expect(screen.queryByRole('radiogroup', { name: /Severidad de Fatiga/i })).not.toBeInTheDocument();
  });

  it('adds a symptom with default severity 3 when its checkbox is checked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SymptomPicker symptoms={[]} onChange={onChange} />);

    await user.click(screen.getByLabelText('Fatiga'));

    expect(onChange).toHaveBeenCalledWith([{ type: 'fatigue', severity: 3 }]);
  });

  it('removes the symptom when its checkbox is unchecked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SymptomPicker symptoms={[{ type: 'fatigue', severity: 4 }]} onChange={onChange} />);

    await user.click(screen.getByLabelText('Fatiga'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows a severity radiogroup for a checked symptom and updates severity on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SymptomPicker symptoms={[{ type: 'fatigue', severity: 3 }]} onChange={onChange} />);

    const severityGroup = screen.getByRole('radiogroup', { name: 'Severidad de Fatiga' });
    await user.click(screen.getByRole('radio', { name: '5' }));

    expect(onChange).toHaveBeenCalledWith([{ type: 'fatigue', severity: 5 }]);
    expect(severityGroup).toBeInTheDocument();
  });

  it('leaves other symptoms untouched when toggling one', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const symptoms = [
      { type: 'fatigue' as const, severity: 2 as const },
      { type: 'panic' as const, severity: 5 as const },
    ];
    render(<SymptomPicker symptoms={symptoms} onChange={onChange} />);

    await user.click(screen.getByLabelText('Fatiga'));

    expect(onChange).toHaveBeenCalledWith([{ type: 'panic', severity: 5 }]);
  });
});
