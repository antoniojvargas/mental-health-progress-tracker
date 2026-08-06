const MOODS = [
  { value: 1, emoji: '😔', label: 'Muy triste' },
  { value: 2, emoji: '🙁', label: 'Triste' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'Muy bien' },
];

export function MoodScale({ value, onChange }: { value: number | null; onChange: (value: number) => void }) {
  return (
    <div role="radiogroup" aria-label="¿Cómo te sientes hoy?" className="flex justify-between gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          role="radio"
          aria-checked={value === mood.value}
          onClick={() => onChange(mood.value)}
          className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl2 border-2 py-3 transition-all duration-200 ${
            value === mood.value
              ? 'border-sage-400 bg-sage-50 scale-105'
              : 'border-transparent bg-calm-50 hover:bg-calm-100'
          }`}
        >
          <span className="text-2xl" aria-hidden="true">
            {mood.emoji}
          </span>
          <span className="text-[11px] font-medium text-dusk-500">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
