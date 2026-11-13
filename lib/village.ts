import { and, asc, count, desc, eq, min, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { boosts, upgrades, villages } from "@/lib/db/schema";
import type { PotionKind } from "@/lib/boosts";
import type { VillageOwnership } from "@/lib/ownership";
import type { UpgradeType } from "@/lib/types";

/** Serializable shape handed to the client dashboard. Times are Unix seconds. */
export interface VillageUpgrade {
  id: string;
  name: string;
  category: UpgradeType;
  villageType: "HOME" | "BUILDER_BASE";
  currentLevel: number;
  targetLevel: number;
  currentFinishTime: number;
  isGearUp: boolean;
  isExtraSlot: boolean;
}

export interface VillageSnapshot {
  playerTag: string;
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
  builderBoostEndsAt: number | null;
  labBoostEndsAt: number | null;
  /** Most recent potion that can still be undone. */
  undoableBoost: { kind: PotionKind; createdAt: string } | null;
  upgrades: VillageUpgrade[];
}

/** Loads a village and its ACTIVE upgrades. `tag` must be normalized ("#XXXX"). */
export interface LoadedVillage {
  village: VillageSnapshot;
  /** Server-only: feed to getVillageAccess(). Not for the client. */
  ownership: VillageOwnership;
}

/** Villages linked to an account, newest sync first. */
export async function getOwnedVillages(ownerId: string) {
  return db
    .select({
      playerTag: villages.playerTag,
      lastExportTimestamp: villages.lastExportTimestamp,
      activeUpgrades: count(upgrades.id),
      nextFinishTime: min(upgrades.currentFinishTime),
    })
    .from(villages)
    .leftJoin(upgrades, and(eq(upgrades.villageId, villages.id), eq(upgrades.status, "ACTIVE")))
    .where(eq(villages.ownerId, ownerId))
    .groupBy(villages.id)
    .orderBy(sql`${villages.lastExportTimestamp} desc nulls last`);
}

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
      .where(and(eq(upgrades.villageId, row.id), eq(upgrades.status, "ACTIVE")))
      .orderBy(asc(upgrades.currentFinishTime)),
    db
      .select({ kind: boosts.kind, createdAt: boosts.createdAt })
      .from(boosts)
      .where(and(eq(boosts.villageId, row.id), eq(boosts.status, "APPLIED")))
      .orderBy(desc(boosts.createdAt))
      .limit(1),
  ]);

  const village: VillageSnapshot = {
    playerTag: row.playerTag ?? tag,
    lastExportTimestamp: row.lastExportTimestamp,
    builderCount: row.builderCount,
    isVerified: Boolean(row.verifiedAt),
    isClaimed: Boolean(row.ownerId),
    webhookAlerts: Boolean(row.discordWebhookUrl),
    dmAlerts: row.dmAlerts,
    alertLeadMinutes: row.alertLeadMinutes,
    builderBoostEndsAt: row.builderBoostEndsAt,
    labBoostEndsAt: row.labBoostEndsAt,
    undoableBoost: latestBoost
      ? { kind: latestBoost.kind as PotionKind, createdAt: latestBoost.createdAt.toISOString() }
      : null,
    upgrades: upgradeRows.map((u) => ({
      id: u.id,
      name: u.entityName,
      category: u.category as UpgradeType,
      villageType: u.villageType === "BUILDER_BASE" ? "BUILDER_BASE" : "HOME",
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
