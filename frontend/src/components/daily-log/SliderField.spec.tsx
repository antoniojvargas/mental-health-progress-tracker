import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SliderField } from './SliderField.js';

describe('SliderField', () => {
  it('renders the label and the raw value when no describe function is given', () => {
    render(<SliderField id="stress" label="Nivel de estrés" min={1} max={10} value={6} onChange={vi.fn()} />);
    expect(screen.getByText('Nivel de estrés')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('uses the describe function to format the displayed value', () => {
    render(
      <SliderField
        id="sleepHours"
        label="Horas de sueño"
        min={0}
        max={14}
        value={7.5}
        onChange={vi.fn()}
        describe={(v) => `${v} h`}
      />,
    );
    expect(screen.getByText('7.5 h')).toBeInTheDocument();
  });

  it('calls onChange with a number when the slider moves', () => {
    const onChange = vi.fn();
    render(<SliderField id="stress" label="Nivel de estrés" min={1} max={10} value={3} onChange={onChange} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });

    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('does not render a hint icon when no hint is given', () => {
    render(<SliderField id="stress" label="Nivel de estrés" min={1} max={10} value={3} onChange={vi.fn()} />);
    expect(screen.queryByLabelText(/Qué significa/i)).not.toBeInTheDocument();
  });

  it('renders an accessible hint icon when a hint is given', () => {
    render(
      <SliderField
        id="anxietyLevel"
        label="Nivel de ansiedad"
        min={1}
        max={10}
        value={3}
        onChange={vi.fn()}
        hint="1 es sin ansiedad, 10 es la más intensa."
      />,
    );
    expect(screen.getByLabelText('Qué significa Nivel de ansiedad')).toBeInTheDocument();
  });
});
