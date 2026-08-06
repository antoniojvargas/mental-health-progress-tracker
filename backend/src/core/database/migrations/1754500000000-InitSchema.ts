import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1754500000000 implements MigrationInterface {
  name = 'InitSchema1754500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "google_id" varchar(64) NOT NULL,
        "email" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "avatar_url" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_google_id" ON "users" ("google_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);

    await queryRunner.query(`
      CREATE TABLE "daily_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "log_date" date NOT NULL,
        "mood_rating" smallint NOT NULL,
        "anxiety_level" smallint NOT NULL,
        "stress_level" smallint NOT NULL,
        "sleep_hours" numeric(3,1) NOT NULL,
        "sleep_quality" smallint NOT NULL,
        "sleep_disturbances" text[] NOT NULL DEFAULT '{}',
        "activity_type" varchar(32),
        "activity_minutes" smallint,
        "social_frequency" varchar(16) NOT NULL,
        "symptoms" jsonb NOT NULL DEFAULT '[]',
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_daily_logs_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_daily_logs_user_id" ON "daily_logs" ("user_id")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_daily_logs_user_id_log_date" ON "daily_logs" ("user_id", "log_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "daily_logs"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
