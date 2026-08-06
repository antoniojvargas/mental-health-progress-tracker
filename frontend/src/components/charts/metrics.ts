import type { DailyLog } from '../../types/daily-log.js';

export interface MetricDef {
  key: string;
  label: string;
  color: string;
  axis: 'scale' | 'hours';
  format: (log: DailyLog) => number;
  describe: (value: number) => string;
}

function scaleLabel(value: number, labels: string[]): string {
  const idx = Math.max(0, Math.min(labels.length - 1, Math.round(value) - 1));
  return labels[idx];
}

export const METRICS: MetricDef[] = [
  {
    key: 'mood',
    label: 'Ánimo',
    color: '#749d7e',
    axis: 'scale',
    format: (l) => l.moodRating,
    describe: (v) => scaleLabel(v, ['muy bajo', 'bajo', 'neutral', 'bueno', 'muy bueno']),
  },
  {
    key: 'anxiety',
    label: 'Ansiedad',
    color: '#7690b6',
    axis: 'scale',
    format: (l) => l.anxietyLevel,
    describe: (v) => `${v}/10`,
  },
  {
    key: 'stress',
    label: 'Estrés',
    color: '#a8926f',
    axis: 'scale',
    format: (l) => l.stressLevel,
    describe: (v) => `${v}/10`,
  },
  {
    key: 'sleepHours',
    label: 'Horas de sueño',
    color: '#57729c',
    axis: 'hours',
    format: (l) => l.sleepHours,
    describe: (v) => `${v} h`,
  },
  {
    key: 'sleepQuality',
    label: 'Calidad de sueño',
    color: '#9cbba4',
    axis: 'scale',
    format: (l) => l.sleepQuality,
    describe: (v) => scaleLabel(v, ['muy mala', 'mala', 'regular', 'buena', 'muy buena']),
  },
  {
    key: 'activityMinutes',
    label: 'Minutos de actividad',
    color: '#43654c',
    axis: 'hours',
    format: (l) => l.activityMinutes ?? 0,
    describe: (v) => `${v} min`,
  },
  {
    key: 'symptomLoad',
    label: 'Carga de síntomas',
    color: '#394a66',
    axis: 'scale',
    format: (l) => (l.symptoms.length ? l.symptoms.reduce((sum, s) => sum + s.severity, 0) / l.symptoms.length : 0),
    describe: (v) => (v === 0 ? 'sin síntomas' : `${v.toFixed(1)}/5`),
  },
];

export function getMetric(key: string): MetricDef {
  return METRICS.find((m) => m.key === key) ?? METRICS[0];
}
