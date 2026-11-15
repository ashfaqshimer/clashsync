import { formatDuration } from "./parser";

/** Exports older than this probably miss upgrades started since. */
export const STALE_AFTER_SECONDS = 12 * 3600;

/**
 * "just now" / "5m ago" / "3h 12m ago" / "2d 4h ago". Coarser than a countdown
 * on purpose: an age doesn't need to tick every second.
 */
export function formatAge(seconds: number): string {
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${formatDuration(seconds - (seconds % 60))} ago`;
  return `${formatDuration(seconds - (seconds % 3600))} ago`;
}

export interface VillageTimers {
  /** Builder's Hut count from the export, if it had one. */
  builderCount: number | null;
  /** Finish times of home-village builder upgrades, Goblin excluded. */
  builderFinishTimes: number[];
  /** Finish times of every upgrade. */
  finishTimes: number[];
  lastExportTimestamp: number | null;
}

export interface VillageStatus {
  running: number;
  nextFinishTime: number | null;
  busyBuilders: number;
  /** Null when the export didn't say how many builders there are. */
  idleBuilders: number | null;
  exportAge: number | null;
  stale: boolean;
  /** Something the player can act on: idle builders, nothing running, or an old export. */
  needsAttention: boolean;
}

/** Summary for a village list row. `now` is Unix seconds (client clock). */
export function villageStatus(v: VillageTimers, now: number): VillageStatus {
  const running = v.finishTimes.filter((t) => t > now);
  const busyBuilders = v.builderFinishTimes.filter((t) => t > now).length;
  // B.O.B. isn't in the export's hut count, so never report fewer builders than are working
  const idleBuilders =
    v.builderCount !== null ? Math.max(v.builderCount, busyBuilders) - busyBuilders : null;
  const exportAge = v.lastExportTimestamp !== null ? now - v.lastExportTimestamp : null;
  const stale = exportAge !== null && exportAge > STALE_AFTER_SECONDS;
  return {
    running: running.length,
    nextFinishTime: running.length > 0 ? Math.min(...running) : null,
    busyBuilders,
    idleBuilders,
    exportAge,
    stale,
    needsAttention: (idleBuilders ?? 0) > 0 || running.length === 0 || stale,
  };
}
