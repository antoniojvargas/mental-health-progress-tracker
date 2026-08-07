import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity.js';
import type {
  ActivityType,
  SleepDisturbance,
  SocialFrequency,
  Symptom,
  SymptomType,
} from '../../../../shared/daily-log.js';

export type { ActivityType, SleepDisturbance, SocialFrequency, Symptom, SymptomType };

@Entity({ name: 'daily_logs' })
@Index(['userId', 'logDate'], { unique: true })
export class DailyLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'log_date', type: 'date' })
  logDate!: string;

  @Column({ name: 'mood_rating', type: 'smallint' })
  moodRating!: number;

  @Column({ name: 'anxiety_level', type: 'smallint' })
  anxietyLevel!: number;

  @Column({ name: 'stress_level', type: 'smallint' })
  stressLevel!: number;

  @Column({ name: 'sleep_hours', type: 'numeric', precision: 3, scale: 1 })
  sleepHours!: string;

  @Column({ name: 'sleep_quality', type: 'smallint' })
  sleepQuality!: number;

  @Column({ name: 'sleep_disturbances', type: 'text', array: true, default: () => "'{}'" })
  sleepDisturbances!: SleepDisturbance[];

  @Column({ name: 'activity_type', type: 'varchar', length: 32, nullable: true })
  activityType!: ActivityType | null;

  @Column({ name: 'activity_minutes', type: 'smallint', nullable: true })
  activityMinutes!: number | null;

  @Column({ name: 'social_frequency', type: 'varchar', length: 16 })
  socialFrequency!: SocialFrequency;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  symptoms!: Symptom[];

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
