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

export interface DailyLog {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyLogInput {
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

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}
