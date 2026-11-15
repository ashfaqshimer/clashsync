ALTER TABLE "villages" ADD COLUMN "idle_reminders" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "villages" ADD COLUMN "idle_reminded_at" timestamp with time zone;