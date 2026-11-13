import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // User UUID or Player Tag identifier
    playerTag: text("player_tag").unique(),
    playerName: text("player_name"),
    townHallLevel: integer("town_hall_level"),
    clanName: text("clan_name"),
    clanBadgeUrl: text("clan_badge_url"),
    discordUserId: text("discord_user_id"),
    discordWebhookUrl: text("discord_webhook_url"),
    lastExportTimestamp: bigint("last_export_timestamp", { mode: "number" }),
    builderCount: integer("builder_count"), // From Builder's Hut count in the export, when present
    verifiedAt: timestamp("verified_at"), // Set once ownership is proven via Supercell API token
    builderBoostEndsAt: bigint("builder_boost_ends_at", { mode: "number" }), // Unix seconds; potions stack after this
    labBoostEndsAt: bigint("lab_boost_ends_at", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("users_player_tag_idx").on(table.playerTag)]
);

export const upgrades = pgTable(
  "upgrades",
  {
    id: text("id").primaryKey(), // Generated upgrade UUID
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dataId: integer("data_id").notNull(),
    entityName: text("entity_name").notNull(),
    category: text("category").notNull(), // 'BUILDER' | 'LABORATORY' | 'PET_HOUSE' | 'BUILDER_BASE' | 'OTHER'
    villageType: text("village_type").default("HOME").notNull(), // 'HOME' | 'BUILDER_BASE'
    currentLevel: integer("current_level").notNull(),
    targetLevel: integer("target_level").notNull(),
    remainingSecondsAtExport: integer("remaining_seconds_at_export").notNull(),
    originalFinishTime: bigint("original_finish_time", {
      mode: "number",
    }).notNull(),
    currentFinishTime: bigint("current_finish_time", {
      mode: "number",
    }).notNull(),
    status: text("status").default("ACTIVE").notNull(), // 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    isGearUp: boolean("is_gear_up").default(false).notNull(),
    isExtraSlot: boolean("is_extra_slot").default(false).notNull(),
    qstashMessageId: text("qstash_message_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("upgrades_user_status_idx").on(table.userId, table.status),
    index("upgrades_finish_time_idx").on(table.currentFinishTime),
  ]
);

export interface BoostChange {
  upgradeId: string;
  from: number; // currentFinishTime before the potion
  to: number; // currentFinishTime after the potion
}

/** Log of potions applied in the app, so the latest one can be undone. */
export const boosts = pgTable(
  "boosts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // 'BUILDER_POTION' | 'RESEARCH_POTION'
    windowStart: bigint("window_start", { mode: "number" }).notNull(),
    windowEnd: bigint("window_end", { mode: "number" }).notNull(),
    previousBoostEndsAt: bigint("previous_boost_ends_at", { mode: "number" }),
    changes: jsonb("changes").$type<BoostChange[]>().notNull(),
    status: text("status").default("APPLIED").notNull(), // 'APPLIED' | 'UNDONE'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("boosts_user_status_idx").on(table.userId, table.status)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Upgrade = typeof upgrades.$inferSelect;
export type NewUpgrade = typeof upgrades.$inferInsert;

