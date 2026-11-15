import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { boosts, upgrades, villages } from "@/lib/db/schema";
import type { PotionKind } from "@/lib/boosts";
import type { VillageOwnership } from "@/lib/ownership";
import type { UpgradeType, VillageType } from "@/lib/types";

/** Serializable shape handed to the client dashboard. Times are Unix seconds. */
export interface VillageUpgrade {
  id: string;
  name: string;
  category: UpgradeType;
  villageType: VillageType;
  currentLevel: number;
  targetLevel: number;
  currentFinishTime: number;
  isGearUp: boolean;
  isExtraSlot: boolean;
}

export interface VillageSnapshot {
  playerTag: string;
  /** In-game name from the Supercell API; null until a lookup succeeds. */
  playerName: string | null;
  townHallLevel: number | null;
  lastExportTimestamp: number | null;
  builderCount: number | null;
  isVerified: boolean;
  /** Linked to some account (maybe not the viewer's). */
  isClaimed: boolean;
  /** Channel webhook saved. The URL itself never leaves the server. */
  webhookAlerts: boolean;
  /** Alerts sent as a DM to the owner. */
  dmAlerts: boolean;
  /** Minutes before a finish that alerts go out (0 = when done). */
  alertLeadMinutes: number;
  /** "Anything sitting idle?" nudge an hour after an upgrade finishes with no re-sync. */
  idleReminders: boolean;
  builderBoostEndsAt: number | null;
  labBoostEndsAt: number | null;
  /** Most recent potion that can still be undone. */
  undoableBoost: { kind: PotionKind; createdAt: string } | null;
  upgrades: VillageUpgrade[];
}

export interface LoadedVillage {
  village: VillageSnapshot;
  /** Server-only: feed to getVillageAccess(). Not for the client. */
  ownership: VillageOwnership;
}

/** One row of "My villages". Finish times are raw so the client can work out what's idle *now*. */
export interface OwnedVillage {
  playerTag: string;
  playerName: string | null;
  townHallLevel: number | null;
  builderCount: number | null;
  lastExportTimestamp: number | null;
  /** Every upgrade's finish time (Unix seconds). */
  finishTimes: number[];
  /** Home builder upgrades only, Goblin excluded (see lib/village-status.ts). */
  builderFinishTimes: number[];
}

/** Villages linked to an account, newest sync first. */
export async function getOwnedVillages(ownerId: string): Promise<OwnedVillage[]> {
  const rows = await db
    .select({
      playerTag: villages.playerTag,
      playerName: villages.playerName,
      townHallLevel: villages.townHallLevel,
      builderCount: villages.builderCount,
      lastExportTimestamp: villages.lastExportTimestamp,
      finishTimes: sql<Array<string | number> | null>`array_agg(${upgrades.currentFinishTime}) filter (where ${upgrades.id} is not null)`,
      builderFinishTimes: sql<Array<string | number> | null>`array_agg(${upgrades.currentFinishTime}) filter (
        where ${upgrades.category} = 'BUILDER' and ${upgrades.villageType} = 'HOME' and not ${upgrades.isExtraSlot}
      )`,
    })
    .from(villages)
    .leftJoin(upgrades, eq(upgrades.villageId, villages.id))
    .where(eq(villages.ownerId, ownerId))
    .groupBy(villages.id)
    .orderBy(sql`${villages.lastExportTimestamp} desc nulls last`);

  // bigint[] comes back as strings from some drivers
  const nums = (a: Array<string | number> | null) => (a ?? []).map(Number);
  return rows.map((r) => ({
    ...r,
    finishTimes: nums(r.finishTimes),
    builderFinishTimes: nums(r.builderFinishTimes),
  }));
}

/** Loads a village and its current upgrades. `tag` must be normalized ("#XXXX"). */
export async function getVillage(tag: string): Promise<LoadedVillage | null> {
  const [row] = await db
    .select()
    .from(villages)
    .where(eq(villages.playerTag, tag))
    .limit(1);

  if (!row) return null;

  const [upgradeRows, [latestBoost]] = await Promise.all([
    db
      .select()
      .from(upgrades)
      .where(eq(upgrades.villageId, row.id))
      .orderBy(asc(upgrades.currentFinishTime)),
    db
      .select({ kind: boosts.kind, createdAt: boosts.createdAt })
      .from(boosts)
      .where(and(eq(boosts.villageId, row.id), eq(boosts.status, "APPLIED")))
      .orderBy(desc(boosts.createdAt))
      .limit(1),
  ]);

  const village: VillageSnapshot = {
    playerTag: row.playerTag,
    playerName: row.playerName,
    townHallLevel: row.townHallLevel,
    lastExportTimestamp: row.lastExportTimestamp,
    builderCount: row.builderCount,
    isVerified: Boolean(row.verifiedAt),
    isClaimed: Boolean(row.ownerId),
    webhookAlerts: Boolean(row.discordWebhookUrl),
    dmAlerts: row.dmAlerts,
    alertLeadMinutes: row.alertLeadMinutes,
    idleReminders: row.idleReminders,
    builderBoostEndsAt: row.builderBoostEndsAt,
    labBoostEndsAt: row.labBoostEndsAt,
    undoableBoost: latestBoost
      ? { kind: latestBoost.kind, createdAt: latestBoost.createdAt.toISOString() }
      : null,
    upgrades: upgradeRows.map((u) => ({
      id: u.id,
      name: u.entityName,
      category: u.category,
      villageType: u.villageType,
      currentLevel: u.currentLevel,
      targetLevel: u.targetLevel,
      currentFinishTime: u.currentFinishTime,
      isGearUp: u.isGearUp,
      isExtraSlot: u.isExtraSlot,
    })),
  };
  return {
    village,
    ownership: { playerTag: row.playerTag, ownerId: row.ownerId },
  };
}

/** Just the stored player name (page titles). `tag` must be normalized. */
export async function getVillageName(tag: string): Promise<string | null> {
  const [row] = await db
    .select({ playerName: villages.playerName })
    .from(villages)
    .where(eq(villages.playerTag, tag))
    .limit(1);
  return row?.playerName ?? null;
}
