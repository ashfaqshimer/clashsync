import type { VillageSnapshot, VillageUpgrade } from "./village";

/**
 * Made-up village for the public demo (/demo) and the home page preview.
 * Times are relative to `now` (client clock), so the timers always look live.
 */

export const DEMO_TITLE = "Demo village";

function up(
  id: string,
  name: string,
  category: VillageUpgrade["category"],
  inSeconds: number,
  now: number,
  levels: [number, number],
  extra: Partial<VillageUpgrade> = {}
): VillageUpgrade {
  return {
    id,
    name,
    category,
    villageType: category === "BUILDER_BASE" ? "BUILDER_BASE" : "HOME",
    currentLevel: levels[0],
    targetLevel: levels[1],
    currentFinishTime: now + inSeconds,
    isGearUp: false,
    isExtraSlot: false,
    ...extra,
  };
}

export function demoVillage(now: number): VillageSnapshot {
  return {
    playerTag: DEMO_TITLE,
    lastExportTimestamp: now - 25 * 60,
    builderCount: 6,
    isVerified: false,
    isClaimed: false,
    webhookAlerts: false,
    dmAlerts: false,
    alertLeadMinutes: 5,
    builderBoostEndsAt: null,
    labBoostEndsAt: null,
    undoableBoost: null,
    upgrades: [
      up("it", "Inferno Tower", "BUILDER", 4 * 60 + 52, now, [9, 10]),
      up("aq", "Archer Queen", "BUILDER", 3 * 3600 + 1111, now, [86, 87]),
      up("ea", "Eagle Artillery", "BUILDER", 2 * 86400 + 5 * 3600, now, [5, 6]),
      up("xb", "X-Bow", "BUILDER", 19 * 3600 + 40 * 60, now, [9, 10]),
      up("es", "Elixir Storage", "BUILDER", 7 * 3600, now, [16, 17], { isExtraSlot: true }),
      up("ed", "Electro Dragon", "LABORATORY", 86400 + 4 * 3600 + 18 * 60, now, [5, 6]),
      up("un", "Unicorn", "PET_HOUSE", 2 * 86400 + 11 * 3600, now, [7, 8]),
      up("mt", "Mega Tesla", "BUILDER_BASE", 3 * 3600 + 7 * 60, now, [8, 9]),
      up("bm", "Battle Machine", "BUILDER_BASE", 16 * 3600, now, [30, 31]),
    ],
  };
}
