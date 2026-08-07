import type {
  ActivityType,
  DailyLogFields,
  SleepDisturbance,
  SocialFrequency,
  Symptom,
  SymptomType,
  UserFields,
} from '../../../shared/daily-log.js';

export type { ActivityType, SleepDisturbance, SocialFrequency, Symptom, SymptomType };

export interface DailyLog extends DailyLogFields {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateDailyLogInput = DailyLogFields;

export type User = UserFields;
