import type { DailyLog } from './daily-log.entity.js';

export interface DailyLogDto {
  id: string;
  logDate: string;
  moodRating: number;
  anxietyLevel: number;
  stressLevel: number;
  sleepHours: number;
  sleepQuality: number;
  sleepDisturbances: DailyLog['sleepDisturbances'];
  activityType: DailyLog['activityType'];
  activityMinutes: number | null;
  socialFrequency: DailyLog['socialFrequency'];
  symptoms: DailyLog['symptoms'];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toDailyLogDto(entity: DailyLog): DailyLogDto {
  return {
    id: entity.id,
    logDate: entity.logDate,
    moodRating: entity.moodRating,
    anxietyLevel: entity.anxietyLevel,
    stressLevel: entity.stressLevel,
    sleepHours: Number(entity.sleepHours),
    sleepQuality: entity.sleepQuality,
    sleepDisturbances: entity.sleepDisturbances,
    activityType: entity.activityType,
    activityMinutes: entity.activityMinutes,
    socialFrequency: entity.socialFrequency,
    symptoms: entity.symptoms,
    notes: entity.notes,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
