import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { upgrades, users } from "@/lib/db/schema";
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
  upgrades: VillageUpgrade[];
}

/** Loads a village and its ACTIVE upgrades. `tag` must be normalized ("#XXXX"). */
export async function getVillage(tag: string): Promise<VillageSnapshot | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.playerTag, tag))
    .limit(1);

  if (!user) return null;

  const rows = await db
    .select()
    .from(upgrades)
    .where(and(eq(upgrades.userId, user.id), eq(upgrades.status, "ACTIVE")))
    .orderBy(asc(upgrades.currentFinishTime));

  return {
    playerTag: user.playerTag ?? tag,
    lastExportTimestamp: user.lastExportTimestamp,
    builderCount: user.builderCount,
    isVerified: Boolean(user.verifiedAt),
    upgrades: rows.map((row) => ({
      id: row.id,
      name: row.entityName,
      category: row.category as UpgradeType,
      villageType: row.villageType === "BUILDER_BASE" ? "BUILDER_BASE" : "HOME",
      currentLevel: row.currentLevel,
      targetLevel: row.targetLevel,
      currentFinishTime: row.currentFinishTime,
      isGearUp: row.isGearUp,
      isExtraSlot: row.isExtraSlot,
    })),
  };
}
