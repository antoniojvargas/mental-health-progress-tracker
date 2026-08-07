import 'reflect-metadata';
import { AppDataSource } from '../data-source.js';
import { User } from '../../../modules/user/user.entity.js';
import {
  DailyLog,
  type SleepDisturbance,
  type Symptom,
} from '../../../modules/daily-log/daily-log.entity.js';

const DEMO_GOOGLE_ID = 'demo-seed-user';
const DEMO_EMAIL = 'demo@mentalhealthtracker.dev';
const DAYS = 60;

const ACTIVITY_TYPES = ['walking', 'running', 'gym', 'yoga', 'cycling', 'sports'] as const;
const SOCIAL_FREQUENCIES = ['none', 'rare', 'occasional', 'frequent', 'daily'] as const;
const SYMPTOM_TYPES: Symptom['type'][] = [
  'low_mood',
  'fatigue',
  'irritability',
  'restlessness',
  'concentration',
];
const DISTURBANCES: SleepDisturbance[] = ['insomnia', 'nightmares', 'frequent_waking', 'early_waking'];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Simple pseudo-random wave so trends look organic instead of pure noise. */
function wave(day: number, period: number, amplitude: number, phase = 0): number {
  return Math.sin((day / period) * Math.PI * 2 + phase) * amplitude;
}

async function main(): Promise<void> {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const logRepo = AppDataSource.getRepository(DailyLog);

  let user = await userRepo.findOne({ where: { googleId: DEMO_GOOGLE_ID } });
  if (!user) {
    user = await userRepo.save(
      userRepo.create({
        googleId: DEMO_GOOGLE_ID,
        email: DEMO_EMAIL,
        name: 'Demo Patient',
        avatarUrl: null,
      }),
    );
    console.log(`Created demo user ${user.email}`);
  } else {
    console.log(`Reusing existing demo user ${user.email}`);
  }

  const today = new Date();
  let created = 0;

  for (let i = DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const logDate = date.toISOString().slice(0, 10);

    const existing = await logRepo.findOne({ where: { userId: user.id, logDate } });
    if (existing) continue;

    const mood = clamp(Math.round(3 + wave(i, 14, 1.5) + (Math.random() - 0.5)), 1, 5);
    const anxiety = clamp(Math.round(5 - wave(i, 14, 2.5) + (Math.random() - 0.5) * 2), 1, 10);
    const stress = clamp(Math.round(5 - wave(i, 10, 2) + (Math.random() - 0.5) * 2), 1, 10);
    const sleepHours = Number(clamp(7 + wave(i, 7, 1, 1) + (Math.random() - 0.5), 4, 9.5).toFixed(1));
    const sleepQuality = clamp(Math.round(3 + wave(i, 7, 1.2, 1)), 1, 5);
    const hasActivity = Math.random() > 0.35;
    const symptomCount = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;

    const symptoms: Symptom[] = Array.from({ length: symptomCount }, () => ({
      type: pick(SYMPTOM_TYPES),
      severity: (Math.floor(Math.random() * 5) + 1) as Symptom['severity'],
    }));

    const sleepDisturbances: SleepDisturbance[] = Math.random() > 0.7 ? [pick(DISTURBANCES)] : [];

    await logRepo.save(
      logRepo.create({
        userId: user.id,
        logDate,
        moodRating: mood,
        anxietyLevel: anxiety,
        stressLevel: stress,
        sleepHours: String(sleepHours),
        sleepQuality,
        sleepDisturbances,
        activityType: hasActivity ? pick(ACTIVITY_TYPES) : 'none',
        activityMinutes: hasActivity ? clamp(Math.round(20 + Math.random() * 60), 10, 120) : 0,
        socialFrequency: pick(SOCIAL_FREQUENCIES),
        symptoms,
        notes: null,
      }),
    );
    created++;
  }

  console.log(`Seeded ${created} new daily logs (${DAYS - created} already existed) for ${user.email}`);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
