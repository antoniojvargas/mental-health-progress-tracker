import type { RangeMode } from '../../hooks/useLogs.js';

export function RangeToggle({ value, onChange }: { value: RangeMode; onChange: (mode: RangeMode) => void }) {
  return (
    <div className="inline-flex rounded-full bg-calm-100 p-1" role="group" aria-label="Rango de tiempo">
      {(['week', 'month'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${
            value === mode ? 'bg-white text-dusk-700 shadow-sm' : 'text-dusk-400 hover:text-dusk-600'
          }`}
        >
          {mode === 'week' ? 'Semana' : 'Mes'}
        </button>
      ))}
    </div>
  );
}
