-- Hand-written: drizzle-kit can't answer its rename prompts non-interactively.
-- The `users` table always held one row per village; accounts live in auth_user.
-- Renames keep every row; the dropped columns were never written to.
ALTER TABLE "users" RENAME TO "villages";--> statement-breakpoint
ALTER TABLE "villages" RENAME CONSTRAINT "users_pkey" TO "villages_pkey";--> statement-breakpoint
ALTER TABLE "villages" RENAME CONSTRAINT "users_player_tag_unique" TO "villages_player_tag_unique";--> statement-breakpoint
ALTER TABLE "villages" RENAME CONSTRAINT "users_owner_id_auth_user_id_fk" TO "villages_owner_id_auth_user_id_fk";--> statement-breakpoint
ALTER INDEX "users_owner_idx" RENAME TO "villages_owner_idx";--> statement-breakpoint
-- Redundant: the unique constraint on player_tag already indexes it
DROP INDEX "users_player_tag_idx";--> statement-breakpoint
ALTER TABLE "villages" DROP COLUMN "player_name";--> statement-breakpoint
ALTER TABLE "villages" DROP COLUMN "town_hall_level";--> statement-breakpoint
ALTER TABLE "villages" DROP COLUMN "clan_name";--> statement-breakpoint
ALTER TABLE "villages" DROP COLUMN "clan_badge_url";--> statement-breakpoint
ALTER TABLE "villages" DROP COLUMN "discord_user_id";--> statement-breakpoint
ALTER TABLE "upgrades" RENAME COLUMN "user_id" TO "village_id";--> statement-breakpoint
ALTER TABLE "upgrades" RENAME CONSTRAINT "upgrades_user_id_users_id_fk" TO "upgrades_village_id_villages_id_fk";--> statement-breakpoint
ALTER INDEX "upgrades_user_status_idx" RENAME TO "upgrades_village_status_idx";--> statement-breakpoint
ALTER TABLE "upgrades" DROP COLUMN "qstash_message_id";--> statement-breakpoint
ALTER TABLE "boosts" RENAME COLUMN "user_id" TO "village_id";--> statement-breakpoint
ALTER TABLE "boosts" RENAME CONSTRAINT "boosts_user_id_users_id_fk" TO "boosts_village_id_villages_id_fk";--> statement-breakpoint
ALTER INDEX "boosts_user_status_idx" RENAME TO "boosts_village_status_idx";
