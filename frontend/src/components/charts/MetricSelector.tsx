import { METRICS } from './metrics.js';

interface MetricSelectorProps {
  selected: string[];
  onChange: (keys: string[]) => void;
}

const MAX_METRICS = 3;

export function MetricSelector({ selected, onChange }: MetricSelectorProps) {
  function toggle(key: string) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    if (selected.length >= MAX_METRICS) return;
    onChange([...selected, key]);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir hasta 3 métricas">
      {METRICS.map((metric) => {
        const active = selected.includes(metric.key);
        const disabled = !active && selected.length >= MAX_METRICS;
        return (
          <button
            key={metric.key}
            type="button"
            onClick={() => toggle(metric.key)}
            disabled={disabled}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? 'border-transparent text-white'
                : 'border-dusk-100 bg-white text-dusk-500 hover:bg-calm-50'
            }`}
            style={active ? { backgroundColor: metric.color } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: active ? 'white' : metric.color }}
              aria-hidden="true"
            />
            {metric.label}
          </button>
        );
      })}
    </div>
  );
}
