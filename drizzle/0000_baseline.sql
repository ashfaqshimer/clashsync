CREATE TABLE "boosts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"window_start" bigint NOT NULL,
	"window_end" bigint NOT NULL,
	"previous_boost_ends_at" bigint,
	"changes" jsonb NOT NULL,
	"status" text DEFAULT 'APPLIED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upgrades" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"data_id" integer NOT NULL,
	"entity_name" text NOT NULL,
	"category" text NOT NULL,
	"village_type" text DEFAULT 'HOME' NOT NULL,
	"current_level" integer NOT NULL,
	"target_level" integer NOT NULL,
	"remaining_seconds_at_export" integer NOT NULL,
	"original_finish_time" bigint NOT NULL,
	"current_finish_time" bigint NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"is_gear_up" boolean DEFAULT false NOT NULL,
	"is_extra_slot" boolean DEFAULT false NOT NULL,
	"qstash_message_id" text,
	"notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"player_tag" text,
	"player_name" text,
	"town_hall_level" integer,
	"clan_name" text,
	"clan_badge_url" text,
	"discord_user_id" text,
	"discord_webhook_url" text,
	"last_export_timestamp" bigint,
	"builder_count" integer,
	"verified_at" timestamp,
	"builder_boost_ends_at" bigint,
	"lab_boost_ends_at" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_player_tag_unique" UNIQUE("player_tag")
);
--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upgrades" ADD CONSTRAINT "upgrades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boosts_user_status_idx" ON "boosts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "upgrades_user_status_idx" ON "upgrades" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "upgrades_finish_time_idx" ON "upgrades" USING btree ("current_finish_time");--> statement-breakpoint
CREATE INDEX "users_player_tag_idx" ON "users" USING btree ("player_tag");