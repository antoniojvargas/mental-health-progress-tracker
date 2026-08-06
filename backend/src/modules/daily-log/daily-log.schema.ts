import { z } from 'zod';

const SLEEP_DISTURBANCES = ['none', 'insomnia', 'nightmares', 'frequent_waking', 'early_waking'] as const;
const ACTIVITY_TYPES = ['none', 'walking', 'running', 'gym', 'yoga', 'cycling', 'sports', 'other'] as const;
const SOCIAL_FREQUENCIES = ['none', 'rare', 'occasional', 'frequent', 'daily'] as const;
const SYMPTOM_TYPES = [
  'low_mood',
  'hopelessness',
  'fatigue',
  'irritability',
  'panic',
  'restlessness',
  'concentration',
  'appetite_change',
] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected format YYYY-MM-DD');

const symptomSchema = z.object({
  type: z.enum(SYMPTOM_TYPES),
  severity: z.number().int().min(1).max(5),
});

export const createDailyLogSchema = z
  .object({
    logDate: isoDate,
    moodRating: z.number().int().min(1).max(5),
    anxietyLevel: z.number().int().min(1).max(10),
    stressLevel: z.number().int().min(1).max(10),
    sleepHours: z.number().min(0).max(24),
    sleepQuality: z.number().int().min(1).max(5),
    sleepDisturbances: z.array(z.enum(SLEEP_DISTURBANCES)).default([]),
    activityType: z.enum(ACTIVITY_TYPES).nullable().default(null),
    activityMinutes: z.number().int().min(0).max(600).nullable().default(null),
    socialFrequency: z.enum(SOCIAL_FREQUENCIES),
    symptoms: z.array(symptomSchema).default([]),
    notes: z.string().max(1000).nullable().default(null),
  })
  .refine((data) => new Date(data.logDate).getTime() <= Date.now(), {
    message: 'logDate cannot be in the future',
    path: ['logDate'],
  });

export type CreateDailyLogInput = z.infer<typeof createDailyLogSchema>;

export const listDailyLogsQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine(
    (data) => {
      if (!data.from || !data.to) return true;
      return new Date(data.from).getTime() <= new Date(data.to).getTime();
    },
    { message: 'from must be before or equal to to', path: ['from'] },
  )
  .refine(
    (data) => {
      if (!data.from || !data.to) return true;
      const days = (new Date(data.to).getTime() - new Date(data.from).getTime()) / 86_400_000;
      return days <= 366;
    },
    { message: 'date range cannot exceed 366 days', path: ['to'] },
  );

export type ListDailyLogsQuery = z.infer<typeof listDailyLogsQuerySchema>;
