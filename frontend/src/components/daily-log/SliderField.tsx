import { Tooltip } from '../ui/Tooltip.js';

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  describe?: (value: number) => string;
  hint?: string;
}

export function SliderField({ id, label, value, min, max, onChange, describe, hint }: SliderFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-dusk-600">
          <label htmlFor={id}>{label}</label>
          {hint && (
            <Tooltip label={hint}>
              <span
                tabIndex={0}
                aria-label={`Qué significa ${label}`}
                className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-calm-100 text-[10px] text-dusk-400"
              >
                ?
              </span>
            </Tooltip>
          )}
        </span>
        <span className="text-sm font-semibold text-sage-600">{describe ? describe(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-calm-100 accent-sage-500"
      />
    </div>
  );
}
