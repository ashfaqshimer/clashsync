-- Schema cleanup (docs: CLAUDE.md → Domain rules). Hand-edited after drizzle-kit generate:
-- USING casts for uuid/timestamptz, FKs dropped and re-added around the id type change,
-- and data cleanup before the constraints that need it.

-- upgrades now hold only the current timers: drop rows replaced by earlier syncs
DELETE FROM "upgrades" WHERE "status" <> 'ACTIVE';--> statement-breakpoint
-- entity_name is the plain name now; the UI adds these labels
UPDATE "upgrades" SET "entity_name" = regexp_replace("entity_name", ' \((Gear-Up|Goblin/Extra)\)', '', 'g');--> statement-breakpoint
-- A village row is always created from a tagged sync or claim
DELETE FROM "villages" WHERE "player_tag" IS NULL;--> statement-breakpoint
DROP INDEX "upgrades_village_status_idx";--> statement-breakpoint
DROP INDEX "upgrades_finish_time_idx";--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone USING "access_token_expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone USING "refresh_token_expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_session" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_session" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_session" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_user" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_user" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_user" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_verification" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_verification" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_verification" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_verification" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "auth_verification" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "upgrades" DROP CONSTRAINT "upgrades_village_id_villages_id_fk";--> statement-breakpoint
ALTER TABLE "boosts" DROP CONSTRAINT "boosts_village_id_villages_id_fk";--> statement-breakpoint
ALTER TABLE "boosts" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "boosts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "boosts" ALTER COLUMN "village_id" SET DATA TYPE uuid USING "village_id"::uuid;--> statement-breakpoint
ALTER TABLE "boosts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "boosts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "village_id" SET DATA TYPE uuid USING "village_id"::uuid;--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "notified_at" SET DATA TYPE timestamp with time zone USING "notified_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "upgrades" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "player_tag" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "verified_at" SET DATA TYPE timestamp with time zone USING "verified_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "villages" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "upgrades" ADD CONSTRAINT "upgrades_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_provider_account_idx" ON "auth_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "upgrades_village_idx" ON "upgrades" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "upgrades_pending_alert_idx" ON "upgrades" USING btree ("current_finish_time") WHERE "upgrades"."notified_at" is null;--> statement-breakpoint
ALTER TABLE "upgrades" DROP COLUMN "remaining_seconds_at_export";--> statement-breakpoint
ALTER TABLE "upgrades" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_kind_check" CHECK ("boosts"."kind" in ('BUILDER_POTION', 'RESEARCH_POTION'));--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_status_check" CHECK ("boosts"."status" in ('APPLIED', 'UNDONE', 'SUPERSEDED'));--> statement-breakpoint
ALTER TABLE "upgrades" ADD CONSTRAINT "upgrades_category_check" CHECK ("upgrades"."category" in ('BUILDER', 'LABORATORY', 'PET_HOUSE', 'BUILDER_BASE', 'OTHER'));--> statement-breakpoint
ALTER TABLE "upgrades" ADD CONSTRAINT "upgrades_village_type_check" CHECK ("upgrades"."village_type" in ('HOME', 'BUILDER_BASE'));--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_alert_lead_check" CHECK ("villages"."alert_lead_minutes" between 0 and 1440);
