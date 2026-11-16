import { sql, type SQL } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  jsonb,
  timestamp,
  uuid,
  index,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
// Relative imports: drizzle-kit loads this file without the @/ alias
import { UPGRADE_TYPES, VILLAGE_TYPES } from "../types";
import { POTION_KINDS } from "../boosts";

/*
 * Conventions
 * - App events (created, verified, notified) are `timestamptz` → JS Date.
 * - Game times (export time, finish times, potion windows) are Unix *seconds*
 *   in `bigint` → JS number. Never mix the two.
 * - Our own ids are `uuid`, generated in app code (`crypto.randomUUID()`) so a
 *   db.batch can reference a row it is about to insert. Better Auth ids are its
 *   own strings, so the auth_* tables keep `text` ids.
 * - Fixed value sets are `text` + a CHECK constraint (not pg enums: adding a
 *   value is a one-line migration instead of an enum ALTER).
 */

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

/** CHECK (col IN ('A', 'B', …)) built from the same constant the types come from. */
const oneOf = (column: AnyPgColumn, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`;

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
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const authSessions = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
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
    // Encrypted by Better Auth (account.encryptOAuthTokens). Read them through
    // auth.api.getAccessToken, never straight from this table.
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("auth_account_user_idx").on(table.userId),
    // Login looks accounts up by (provider, provider's user id); one link each
    uniqueIndex("auth_account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const authVerifications = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)]
);

/** One row per Clash village, keyed by player tag. Owned by an account via `ownerId`. */
export const villages = pgTable(
  "villages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerTag: text("player_tag").notNull().unique(), // "#XXXX", always via normalizeTag()
    // Account that owns this village. Null = unclaimed (anyone can sync it).
    ownerId: text("owner_id").references(() => authUsers.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }), // Last time ownership was proven with the in-game API token

    // From the latest export
    lastExportTimestamp: bigint("last_export_timestamp", { mode: "number" }),
    builderCount: integer("builder_count"), // Builder's Hut count, when the export has it
    // From the Supercell API (the export has no player name). Set on sync, refreshed when the dashboard loads
    playerName: text("player_name"),
    townHallLevel: integer("town_hall_level"),
    // Potions running (Unix seconds); the next potion starts when these end
    builderBoostEndsAt: bigint("builder_boost_ends_at", { mode: "number" }),
    labBoostEndsAt: bigint("lab_boost_ends_at", { mode: "number" }),
    // Helper Hut (null = not unlocked): level, and when it can next be assigned (Unix seconds)
    apprenticeLevel: integer("apprentice_level"),
    apprenticeReadyAt: bigint("apprentice_ready_at", { mode: "number" }),
    labAssistantLevel: integer("lab_assistant_level"),
    labAssistantReadyAt: bigint("lab_assistant_ready_at", { mode: "number" }),

    // Alerts (owner only)
    // Encrypted with lib/secrets.ts (it can post to the channel). Never sent to the client.
    discordWebhookUrl: text("discord_webhook_url"),
    dmAlerts: boolean("dm_alerts").default(false).notNull(), // DM the owner (needs ownerId)
    // Alert this many minutes before an upgrade finishes (0 = when done). See lib/alerts.ts
    alertLeadMinutes: integer("alert_lead_minutes").default(5).notNull(),
    // "Something may be idle" nudge, an hour after an upgrade finishes with no re-sync (lib/notify.ts)
    idleReminders: boolean("idle_reminders").default(true).notNull(),
    // Set when that nudge is claimed; a sync clears it. At most one nudge per sync.
    idleRemindedAt: timestamp("idle_reminded_at", { withTimezone: true }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("villages_owner_idx").on(table.ownerId),
    check("villages_alert_lead_check", sql`${table.alertLeadMinutes} between 0 and 1440`),
  ]
);

/**
 * The village's *current* timers: exactly what the latest export (plus potions)
 * says is running. A sync deletes the village's rows and inserts the new set in
 * one batch; there's no history. Finished upgrades stay until the next sync.
 */
export const upgrades = pgTable(
  "upgrades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    dataId: integer("data_id").notNull(),
    entityName: text("entity_name").notNull(), // Plain name; the UI adds gear-up / extra labels (upgradeLabel)
    category: text("category", { enum: UPGRADE_TYPES }).notNull(),
    villageType: text("village_type", { enum: VILLAGE_TYPES }).default("HOME").notNull(),
    currentLevel: integer("current_level").notNull(),
    targetLevel: integer("target_level").notNull(),
    originalFinishTime: bigint("original_finish_time", { mode: "number" }).notNull(), // From the export
    currentFinishTime: bigint("current_finish_time", { mode: "number" }).notNull(), // After potions
    isGearUp: boolean("is_gear_up").default(false).notNull(),
    isExtraSlot: boolean("is_extra_slot").default(false).notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }), // Set when the notify sweep claims this upgrade
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("upgrades_village_idx").on(table.villageId),
    // The alert sweep: un-notified upgrades by finish time
    index("upgrades_pending_alert_idx").on(table.currentFinishTime).where(sql`${table.notifiedAt} is null`),
    check("upgrades_category_check", oneOf(table.category, UPGRADE_TYPES)),
    check("upgrades_village_type_check", oneOf(table.villageType, VILLAGE_TYPES)),
  ]
);

export interface BoostChange {
  upgradeId: string;
  from: number; // currentFinishTime before the potion
  to: number; // currentFinishTime after the potion
}

export const BOOST_STATUSES = ["APPLIED", "UNDONE", "SUPERSEDED"] as const;

/** Log of potions applied in the app, so the latest one can be undone. */
export const boosts = pgTable(
  "boosts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    villageId: uuid("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: POTION_KINDS }).notNull(),
    windowStart: bigint("window_start", { mode: "number" }).notNull(),
    windowEnd: bigint("window_end", { mode: "number" }).notNull(),
    previousBoostEndsAt: bigint("previous_boost_ends_at", { mode: "number" }),
    changes: jsonb("changes").$type<BoostChange[]>().notNull(),
    // UNDONE = undo button; SUPERSEDED = a later sync or timer change made undo impossible
    status: text("status", { enum: BOOST_STATUSES }).default("APPLIED").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("boosts_village_status_idx").on(table.villageId, table.status),
    check("boosts_kind_check", oneOf(table.kind, POTION_KINDS)),
    check("boosts_status_check", oneOf(table.status, BOOST_STATUSES)),
  ]
);

export type Village = typeof villages.$inferSelect;
export type NewVillage = typeof villages.$inferInsert;
export type Upgrade = typeof upgrades.$inferSelect;
export type NewUpgrade = typeof upgrades.$inferInsert;
