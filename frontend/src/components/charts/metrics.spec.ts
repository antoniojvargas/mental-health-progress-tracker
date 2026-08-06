import { describe, expect, it } from 'vitest';
import { getMetric, METRICS } from './metrics.js';
import type { DailyLog } from '../../types/daily-log.js';

function makeLog(overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    id: 'log-1',
    logDate: '2026-08-01',
    moodRating: 3,
    anxietyLevel: 4,
    stressLevel: 5,
    sleepHours: 7.5,
    sleepQuality: 3,
    sleepDisturbances: [],
    activityType: null,
    activityMinutes: null,
    socialFrequency: 'occasional',
    symptoms: [],
    notes: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('getMetric', () => {
  it('returns the metric matching the given key', () => {
    expect(getMetric('anxiety').label).toBe('Ansiedad');
  });

  it('falls back to the first metric for an unknown key', () => {
    expect(getMetric('does-not-exist')).toBe(METRICS[0]);
  });
});

describe('mood metric', () => {
  const mood = getMetric('mood');

  it('reads moodRating from the log', () => {
    expect(mood.format(makeLog({ moodRating: 5 }))).toBe(5);
  });

  it('describes each point on the 1-5 scale in natural language', () => {
    expect(mood.describe(1)).toBe('muy bajo');
    expect(mood.describe(3)).toBe('neutral');
    expect(mood.describe(5)).toBe('muy bueno');
  });

  it('clamps out-of-range values instead of returning undefined', () => {
    expect(mood.describe(0)).toBe('muy bajo');
    expect(mood.describe(99)).toBe('muy bueno');
  });
});

describe('sleepHours metric', () => {
  const sleepHours = getMetric('sleepHours');

  it('is plotted on the hours axis, not the 1-10 scale axis', () => {
    expect(sleepHours.axis).toBe('hours');
  });

  it('formats hours with a unit suffix', () => {
    expect(sleepHours.describe(7.5)).toBe('7.5 h');
  });
});

describe('activityMinutes metric', () => {
  const activityMinutes = getMetric('activityMinutes');

  it('treats a null activityMinutes as zero, not NaN', () => {
    expect(activityMinutes.format(makeLog({ activityMinutes: null }))).toBe(0);
  });
});

describe('symptomLoad metric', () => {
  const symptomLoad = getMetric('symptomLoad');

  it('is zero and reads as "sin síntomas" when there are no symptoms', () => {
    const log = makeLog({ symptoms: [] });
    expect(symptomLoad.format(log)).toBe(0);
    expect(symptomLoad.describe(symptomLoad.format(log))).toBe('sin síntomas');
  });

  it('averages severity across all logged symptoms', () => {
    const log = makeLog({
      symptoms: [
        { type: 'fatigue', severity: 2 },
        { type: 'irritability', severity: 4 },
      ],
    });
    expect(symptomLoad.format(log)).toBe(3);
    expect(symptomLoad.describe(3)).toBe('3.0/5');
  });
});
