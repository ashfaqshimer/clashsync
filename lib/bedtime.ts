/**
 * Bedtime plan: free ways to stop a slot sitting idle overnight. Pure, runs
 * on the client next to lib/timeline.ts. All times are Unix seconds.
 *
 * Helpers (Helper Hut, home village): the Builder's Apprentice works on one
 * builder upgrade and the Lab Assistant on one lab research for an hour, at
 * (level + 1)× speed, so they take `level` hours off the timer. Afterwards all
 * helpers share one ~23h cooldown (the export's `helper_cooldown`). If the
 * upgrade has less than level + 1 hours left, the rest of that hour is wasted,
 * so a helper is only suggested where its full value counts.
 */

export type HelperKind = "builder" | "lab";

/** A helper's level and when it can next be assigned (from the latest export). */
export interface HelperState {
  level: number;
  readyAt: number;
}

export type Helpers = Partial<Record<HelperKind, HelperState>>;

/** Export `helpers[].data` ids. The other two helpers (ids …02, …03) don't speed up timers. */
export const HELPER_IDS: Record<HelperKind, number> = { builder: 93000000, lab: 93000001 };

export const HELPER_NAMES: Record<HelperKind, string> = {
  builder: "Builder's Apprentice",
  lab: "Lab Assistant",
};

/** A helper works for this long once assigned. */
export const HELPER_WORK_SECONDS = 3600;

/** Hours a helper takes off an upgrade's timer. */
export function helperSavesSeconds(level: number): number {
  return level * 3600;
}

/** Only suggest staying up when the finish is at most this long after bedtime. */
export const STAY_UP_MAX_SECONDS = 3600;

export interface BedtimeItem {
  id: string;
  finish: number;
  /** Which helper can work on it; null for pets, Builder Base and the like. */
  helper: HelperKind | null;
  /** Goblin / bonus slot: not a slot the player loses overnight, so no fixes. */
  extra?: boolean;
}

export type BedtimeFix =
  /** Finishes soon after bedtime: stay up and start the next upgrade. */
  | { kind: "stayUp"; until: number }
  /** Use the helper (any time before `useBy`) and it finishes before bed instead, at `newFinish`. */
  | { kind: "helper"; helper: HelperKind; useBy: number; newFinish: number };

export interface HelperTip {
  helper: HelperKind;
  /** Ready before bedtime but not needed for a fix: where its full value counts. */
  ready: boolean;
  readyAt: number;
  /** Longest running upgrade it could work on without wasting time. */
  suggestId: string | null;
}

export interface BedtimePlan {
  /** Fixes per overnight item id, cheapest first. */
  fixes: Record<string, BedtimeFix[]>;
  /** Overnight items with at least one fix. */
  fixable: number;
  /** One per helper the player has that isn't used by a fix. */
  helperTips: HelperTip[];
}

/**
 * Finds fixes for upgrades that finish while the player sleeps (between
 * `night.start` and `night.end`). Each helper is offered for at most one
 * upgrade: one that staying up a bit can't fix, else the one idle longest.
 */
export function planBedtime(
  items: BedtimeItem[],
  night: { start: number; end: number },
  now: number,
  helpers: Helpers = {}
): BedtimePlan {
  const running = items.filter((i) => i.finish > now);
  const overnight = running
    .filter((i) => !i.extra && i.finish >= night.start && i.finish <= night.end)
    .sort((a, b) => a.finish - b.finish);

  const fixes: Record<string, BedtimeFix[]> = {};
  const add = (id: string, fix: BedtimeFix) => (fixes[id] ??= []).push(fix);

  for (const item of overnight) {
    if (item.finish - night.start <= STAY_UP_MAX_SECONDS) add(item.id, { kind: "stayUp", until: item.finish });
  }

  const usedHelpers = new Set<HelperKind>();
  for (const kind of ["builder", "lab"] as const) {
    const state = helpers[kind];
    if (!state || state.level <= 0) continue;
    const saves = helperSavesSeconds(state.level);
    const from = Math.max(now, state.readyAt);
    const best = overnight
      .filter((i) => i.helper === kind)
      // Upgrades staying up can't fix first, then most idle time (earliest finish)
      .sort((x, y) => Number(Boolean(fixes[x.id])) - Number(Boolean(fixes[y.id])) || x.finish - y.finish)
      .map((i) => ({
        item: i,
        newFinish: i.finish - saves,
        // Later than this, under level + 1 hours are left and part of the hour is wasted
        useBy: i.finish - saves - HELPER_WORK_SECONDS,
      }))
      .find((c) => c.newFinish <= night.start && c.useBy >= from);
    if (!best) continue;
    usedHelpers.add(kind);
    add(best.item.id, { kind: "helper", helper: kind, useBy: best.useBy, newFinish: best.newFinish });
  }

  const helperTips: HelperTip[] = [];
  for (const kind of ["builder", "lab"] as const) {
    const state = helpers[kind];
    if (!state || state.level <= 0 || usedHelpers.has(kind)) continue;
    const ready = state.readyAt <= night.start;
    const from = Math.max(now, state.readyAt);
    const need = helperSavesSeconds(state.level) + HELPER_WORK_SECONDS;
    const longest = running
      .filter((i) => i.helper === kind && i.finish - from >= need)
      .sort((a, b) => b.finish - a.finish)[0];
    helperTips.push({ helper: kind, ready, readyAt: state.readyAt, suggestId: longest?.id ?? null });
  }

  return {
    fixes,
    fixable: overnight.filter((i) => fixes[i.id]?.length).length,
    helperTips,
  };
}
