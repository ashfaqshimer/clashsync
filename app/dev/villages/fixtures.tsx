"use client";

import type { OwnedVillage } from "@/lib/village";
import { useNow } from "@/app/v/[tag]/use-now";

/** Fixture villages relative to the client clock, so every status shows up. */
export function useFixtureVillages(): { list: OwnedVillage[]; welcome: OwnedVillage[] } | null {
  const now = useNow();
  if (now === null) return null;
  const h = 3600;
  const main: OwnedVillage = {
    playerTag: "#2PP0JQ9V",
    playerName: "Chief Ada",
    townHallLevel: 16,
    builderCount: 6,
    lastExportTimestamp: now - 40 * 60,
    builderFinishTimes: [now + 2 * h, now + 9 * h, now + 30 * h, now + 50 * h],
    finishTimes: [now + 2 * h, now + 9 * h, now + 30 * h, now + 50 * h, now + 20 * h],
  };
  const busy: OwnedVillage = {
    playerTag: "#9QQ2LL8Y",
    playerName: "Ada Alt",
    townHallLevel: 11,
    builderCount: 3,
    lastExportTimestamp: now - 3 * h - 12 * 60,
    builderFinishTimes: [now + 5 * h, now + 6 * h, now + 80 * h],
    finishTimes: [now + 5 * h, now + 6 * h, now + 80 * h],
  };
  const stale: OwnedVillage = {
    playerTag: "#Q8LRV2CJ",
    playerName: null,
    townHallLevel: null,
    builderCount: 2,
    lastExportTimestamp: now - 37 * h,
    builderFinishTimes: [now + 4 * h, now + 9 * h],
    finishTimes: [now + 4 * h, now + 9 * h],
  };
  const empty: OwnedVillage = {
    playerTag: "#Y0RC8UV2",
    playerName: "Ada Mini",
    townHallLevel: 7,
    builderCount: null,
    lastExportTimestamp: null,
    builderFinishTimes: [],
    finishTimes: [],
  };
  return { list: [busy, main, stale, empty], welcome: [main, busy] };
}
