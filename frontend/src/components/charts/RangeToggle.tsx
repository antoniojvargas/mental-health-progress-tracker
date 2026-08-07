import type { RangeMode } from '../../hooks/useLogs.js';

export function RangeToggle({ value, onChange }: { value: RangeMode; onChange: (mode: RangeMode) => void }) {
  return (
    <div className="inline-flex rounded-full bg-paper-200 p-1" role="group" aria-label="Rango de tiempo">
      {(['week', 'month'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
            value === mode ? 'bg-white text-ink-700 shadow-sm' : 'text-ink-400 hover:text-ink-600'
          }`}
        >
          {mode === 'week' ? 'Semana' : 'Mes'}
        </button>
      ))}
    </div>
  );
}
