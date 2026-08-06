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

  async upsert(userId: string, input: CreateDailyLogInput): Promise<{ log: DailyLog; created: boolean }> {
    const existing = await repository().findOne({ where: { userId, logDate: input.logDate } });

    if (existing) {
      repository().merge(existing, toEntityInput(userId, input));
      const log = await repository().save(existing);
      return { log, created: false };
    }

    const log = await repository().save(repository().create(toEntityInput(userId, input)));
    return { log, created: true };
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
