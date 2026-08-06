import type { Symptom, SymptomType } from '../../types/daily-log.js';

const SYMPTOM_LABELS: Record<SymptomType, string> = {
  low_mood: 'Ánimo bajo',
  hopelessness: 'Desesperanza',
  fatigue: 'Fatiga',
  irritability: 'Irritabilidad',
  panic: 'Pánico',
  restlessness: 'Inquietud',
  concentration: 'Dificultad para concentrarse',
  appetite_change: 'Cambios en el apetito',
};

interface SymptomPickerProps {
  symptoms: Symptom[];
  onChange: (symptoms: Symptom[]) => void;
}

export function SymptomPicker({ symptoms, onChange }: SymptomPickerProps) {
  function toggle(type: SymptomType) {
    const existing = symptoms.find((s) => s.type === type);
    if (existing) {
      onChange(symptoms.filter((s) => s.type !== type));
    } else {
      onChange([...symptoms, { type, severity: 3 }]);
    }
  }

  function setSeverity(type: SymptomType, severity: Symptom['severity']) {
    onChange(symptoms.map((s) => (s.type === type ? { ...s, severity } : s)));
  }

  return (
    <div className="space-y-2">
      {(Object.keys(SYMPTOM_LABELS) as SymptomType[]).map((type) => {
        const symptom = symptoms.find((s) => s.type === type);
        const checked = Boolean(symptom);
        return (
          <div key={type} className="rounded-xl2 bg-calm-50 px-3 py-2.5">
            <label className="flex items-center gap-2.5 text-sm font-medium text-dusk-600">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(type)}
                className="h-4 w-4 rounded accent-sage-500"
              />
              {SYMPTOM_LABELS[type]}
            </label>
            {checked && symptom && (
              <div className="mt-2 flex items-center gap-2 pl-6" role="radiogroup" aria-label={`Severidad de ${SYMPTOM_LABELS[type]}`}>
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={symptom.severity === level}
                    onClick={() => setSeverity(type, level)}
                    className={`h-6 w-6 rounded-full text-xs font-semibold transition-colors duration-200 ${
                      symptom.severity === level
                        ? 'bg-sage-500 text-white'
                        : 'bg-white text-dusk-400 hover:bg-sage-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
