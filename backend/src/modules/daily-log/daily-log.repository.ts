import { AppDataSource } from '../../core/database/data-source.js';
import { DailyLog, type Symptom } from './daily-log.entity.js';
import type { CreateDailyLogInput } from './daily-log.schema.js';

const repository = () => AppDataSource.getRepository(DailyLog);

function toEntityInput(userId: string, input: CreateDailyLogInput) {
  return {
    ...input,
    userId,
    sleepHours: String(input.sleepHours),
    symptoms: input.symptoms as Symptom[],
  };
}

export const dailyLogRepository = {
  async findByUserAndDate(userId: string, logDate: string): Promise<DailyLog | null> {
    return repository().findOne({ where: { userId, logDate } });
  },

  /**
   * A plain select-then-insert/update here would race: two concurrent submissions for the
   * same (userId, logDate) could both see "no existing row" and both attempt an insert, with
   * the loser crashing on the unique constraint instead of updating. This does the check and
   * the write in one atomic statement via ON CONFLICT, and reads `xmax = 0` (a Postgres
   * internal column, true only for a row's own fresh insert within this statement) to learn
   * whether we inserted or updated — the one thing INSERT ... ON CONFLICT doesn't tell you
   * on its own, and which the caller needs to pick 201 vs 200 and the right socket event.
   */
  async upsert(userId: string, input: CreateDailyLogInput): Promise<{ log: DailyLog; created: boolean }> {
    const e = toEntityInput(userId, input);
    const [{ id, wasInserted }] = await AppDataSource.query<{ id: string; wasInserted: boolean }[]>(
      `
        INSERT INTO daily_logs (
          user_id, log_date, mood_rating, anxiety_level, stress_level, sleep_hours, sleep_quality,
          sleep_disturbances, activity_type, activity_minutes, social_frequency, symptoms, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (user_id, log_date) DO UPDATE SET
          mood_rating = EXCLUDED.mood_rating,
          anxiety_level = EXCLUDED.anxiety_level,
          stress_level = EXCLUDED.stress_level,
          sleep_hours = EXCLUDED.sleep_hours,
          sleep_quality = EXCLUDED.sleep_quality,
          sleep_disturbances = EXCLUDED.sleep_disturbances,
          activity_type = EXCLUDED.activity_type,
          activity_minutes = EXCLUDED.activity_minutes,
          social_frequency = EXCLUDED.social_frequency,
          symptoms = EXCLUDED.symptoms,
          notes = EXCLUDED.notes,
          updated_at = now()
        RETURNING id, (xmax = 0) AS "wasInserted"
      `,
      [
        userId,
        e.logDate,
        e.moodRating,
        e.anxietyLevel,
        e.stressLevel,
        e.sleepHours,
        e.sleepQuality,
        e.sleepDisturbances,
        e.activityType,
        e.activityMinutes,
        e.socialFrequency,
        JSON.stringify(e.symptoms),
        e.notes,
      ],
    );

    const log = await repository().findOneByOrFail({ id });
    return { log, created: wasInserted };
  },

  async findByUserAndRange(userId: string, from: string, to: string): Promise<DailyLog[]> {
    return repository()
      .createQueryBuilder('log')
      .where('log.user_id = :userId', { userId })
      .andWhere('log.log_date BETWEEN :from AND :to', { from, to })
      .orderBy('log.log_date', 'ASC')
      .getMany();
  },
};
