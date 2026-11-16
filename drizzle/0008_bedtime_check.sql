ALTER TABLE "villages" ADD COLUMN "bedtime_check" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "villages" ADD COLUMN "night_start_hour" integer DEFAULT 23 NOT NULL;--> statement-breakpoint
ALTER TABLE "villages" ADD COLUMN "night_end_hour" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "villages" ADD COLUMN "time_zone" text;--> statement-breakpoint
ALTER TABLE "villages" ADD COLUMN "bedtime_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_night_hours_check" CHECK ("villages"."night_start_hour" between 0 and 23 and "villages"."night_end_hour" between 0 and 23);