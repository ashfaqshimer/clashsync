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

/*
 * Login (Better Auth + Discord). These are *people*; a person owns villages
 * through `villages.owner_id`. Property names are what Better Auth expects;
 * see lib/auth.ts for the model-name mapping.
 */
export const authUsers = pgTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authSessions = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [index("auth_session_user_idx").on(table.userId)]
);

export const authAccounts = pgTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(), // Discord user id for providerId 'discord'
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("auth_account_user_idx").on(table.userId)]
);

export const authVerifications = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)]
);

/** One row per Clash village, keyed by player tag. Owned by an account via `ownerId`. */
export const villages = pgTable(
  "villages",
  {
    id: text("id").primaryKey(),
    playerTag: text("player_tag").unique(), // "#XXXX", always via normalizeTag()
    // Account that owns this village. Null = unclaimed (anyone can sync it).
    ownerId: text("owner_id").references(() => authUsers.id, { onDelete: "set null" }),
    // Send completion alerts as a Discord DM to the owner (needs ownerId)
    dmAlerts: boolean("dm_alerts").default(false).notNull(),
    // Alert this many minutes before an upgrade finishes (0 = when done). See lib/alerts.ts
    alertLeadMinutes: integer("alert_lead_minutes").default(5).notNull(),
    discordWebhookUrl: text("discord_webhook_url"),
    lastExportTimestamp: bigint("last_export_timestamp", { mode: "number" }),
    builderCount: integer("builder_count"), // From Builder's Hut count in the export, when present
    verifiedAt: timestamp("verified_at"), // Last time ownership was proven with the in-game API token
    builderBoostEndsAt: bigint("builder_boost_ends_at", { mode: "number" }), // Unix seconds; potions stack after this
    labBoostEndsAt: bigint("lab_boost_ends_at", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("villages_owner_idx").on(table.ownerId)]
);

export const upgrades = pgTable(
  "upgrades",
  {
    id: text("id").primaryKey(), // Generated upgrade UUID
    villageId: text("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
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
    // 'ACTIVE' | 'CANCELLED' (replaced by a later sync). Finished upgrades stay ACTIVE.
    status: text("status").default("ACTIVE").notNull(),
    isGearUp: boolean("is_gear_up").default(false).notNull(),
    isExtraSlot: boolean("is_extra_slot").default(false).notNull(),
    notifiedAt: timestamp("notified_at"), // Set when the notify sweep claims this upgrade (before or at its finish)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("upgrades_village_status_idx").on(table.villageId, table.status),
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
    villageId: text("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // 'BUILDER_POTION' | 'RESEARCH_POTION'
    windowStart: bigint("window_start", { mode: "number" }).notNull(),
    windowEnd: bigint("window_end", { mode: "number" }).notNull(),
    previousBoostEndsAt: bigint("previous_boost_ends_at", { mode: "number" }),
    changes: jsonb("changes").$type<BoostChange[]>().notNull(),
    status: text("status").default("APPLIED").notNull(), // 'APPLIED' | 'UNDONE' | 'SUPERSEDED'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("boosts_village_status_idx").on(table.villageId, table.status)]
);

export type Village = typeof villages.$inferSelect;
export type NewVillage = typeof villages.$inferInsert;
export type Upgrade = typeof upgrades.$inferSelect;
export type NewUpgrade = typeof upgrades.$inferInsert;

