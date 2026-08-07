/**
 * The single source of truth for the shape of a daily log, imported type-only by both the
 * backend (Postgres entity + zod schema) and the frontend (form state + API types). Nothing
 * here is a runtime value — every consumer imports it via `import type`, so it's erased
 * entirely at compile time and adds no build step, no package, and no Docker/runtime
 * footprint. Its only job is to give the compiler one place to catch drift: if a field or
 * enum value changes here without updating a consumer, that consumer fails to type-check
 * instead of silently disagreeing with the others at runtime.
 */

export type SleepDisturbance = 'none' | 'insomnia' | 'nightmares' | 'frequent_waking' | 'early_waking';

export type ActivityType = 'none' | 'walking' | 'running' | 'gym' | 'yoga' | 'cycling' | 'sports' | 'other';

export type SocialFrequency = 'none' | 'rare' | 'occasional' | 'frequent' | 'daily';

export type SymptomType =
  | 'low_mood'
  | 'hopelessness'
  | 'fatigue'
  | 'irritability'
  | 'panic'
  | 'restlessness'
  | 'concentration'
  | 'appetite_change';

export interface Symptom {
  type: SymptomType;
  severity: 1 | 2 | 3 | 4 | 5;
}

/** Fields a patient submits for one day. The backend's DB entity and validation schema, and
 * the frontend's form and API types, all describe this same shape independently — this
 * interface is what keeps them honest. */
export interface DailyLogFields {
  logDate: string;
  moodRating: number;
  anxietyLevel: number;
  stressLevel: number;
  sleepHours: number;
  sleepQuality: number;
  sleepDisturbances: SleepDisturbance[];
  activityType: ActivityType | null;
  activityMinutes: number | null;
  socialFrequency: SocialFrequency;
  symptoms: Symptom[];
  notes: string | null;
}

export interface UserFields {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}
