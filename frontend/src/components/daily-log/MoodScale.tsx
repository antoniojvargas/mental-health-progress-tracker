import type { SVGProps } from 'react';

const MOODS = [
  { value: 1, label: 'Muy triste', Icon: StormIcon },
  { value: 2, label: 'Triste', Icon: CloudyIcon },
  { value: 3, label: 'Neutral', Icon: PartlyCloudyIcon },
  { value: 4, label: 'Bien', Icon: SunIcon },
  { value: 5, label: 'Muy bien', Icon: RadiantSunIcon },
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
          className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl2 border py-3 transition-all duration-200 ${
            value === mood.value
              ? 'border-clearsky-400 bg-clearsky-50 text-clearsky-600 scale-105'
              : 'border-transparent bg-paper-100 text-ink-500 hover:bg-paper-200'
          }`}
        >
          <mood.Icon aria-hidden="true" className="h-6 w-6" />
          <span className="text-[11px] font-medium">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}

function StormIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
      <path d="M6 12a4 4 0 0 1 .3-7.98A5 5 0 0 1 16 5.5 4.5 4.5 0 0 1 15.5 12H6Z" />
      <path d="M12 13.5 9.5 17h3L10 21" />
    </svg>
  );
}

function CloudyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
      <path d="M6 13a4 4 0 0 1 .3-7.98A5 5 0 0 1 16 6.5 4.5 4.5 0 0 1 15.5 13H6Z" />
      <path d="M8 17h8M9 20h6" />
    </svg>
  );
}

function PartlyCloudyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
      <circle cx="8" cy="7.5" r="3" />
      <path d="M8 3.5v1M4.5 7.5h-1M5.4 4.4l.7.7M10.6 4.4l-.7.7" />
      <path d="M9 20h7a3.5 3.5 0 0 0 .4-6.98A4.2 4.2 0 0 0 8.7 12" />
    </svg>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3.5v2M12 18.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M3.5 12h2M18.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  );
}

function RadiantSunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  );
}
