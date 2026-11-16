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
 *
 * Potions come after the free fixes: a Builder Potion speeds up every home
 * builder at once (and a Research Potion the lab), so it is simulated on all
 * of them and only suggested when the night's total idle time goes down.
 */

import { boostedFinishTime, POTIONS, type PotionKind } from "./boosts";

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
  /** Which helper and potion can speed it up: home builder or lab. Null for pets, Builder Base and the like. */
  helper: HelperKind | null;
  /** Goblin / bonus slot: not a slot the player loses overnight, so no fixes. */
  extra?: boolean;
}

export type BedtimeFix =
  /** Finishes soon after bedtime: stay up and start the next upgrade. */
  | { kind: "stayUp"; until: number }
  /** Use the helper (any time before `useBy`) and it finishes before bed instead, at `newFinish`. */
  | { kind: "helper"; helper: HelperKind; useBy: number; newFinish: number }
  /**
   * Drink a potion at `useAt` and it finishes before bed, at `newFinish`.
   * `wasted`: other upgrades are too close to done to get the full boost.
   * `movesIntoNight`: upgrades that would then finish while asleep instead of after.
   */
  | { kind: "potion"; potion: PotionKind; useAt: number; newFinish: number; wasted: boolean; movesIntoNight: string[] };

/** Which potion speeds up which slot. */
export const SLOT_POTION: Record<HelperKind, PotionKind> = { builder: "BUILDER_POTION", lab: "RESEARCH_POTION" };

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
  helpers: Helpers = {},
  /** When a potion already running ends (the next one starts then). */
  boostEndsAt: Partial<Record<HelperKind, number | null>> = {}
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

  for (const kind of ["builder", "lab"] as const) {
    const fix = potionFix(kind, running, overnight, fixes, night, Math.max(now, boostEndsAt[kind] ?? 0));
    if (fix) for (const id of fix.ids) add(id, fix.fix);
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

/** Seconds asleep-and-idle for a finish (0 if it isn't overnight). */
function idleAt(finish: number, night: { start: number; end: number }): number {
  return finish >= night.start && finish <= night.end ? night.end - finish : 0;
}

/**
 * Best time to drink the slot's potion, if it pulls overnight finishes that
 * have no free fix before bed and lowers the night's total idle time.
 */
function potionFix(
  kind: HelperKind,
  running: BedtimeItem[],
  overnight: BedtimeItem[],
  fixes: Record<string, BedtimeFix[]>,
  night: { start: number; end: number },
  from: number
): { ids: string[]; fix: BedtimeFix } | null {
  const potion = SLOT_POTION[kind];
  const { multiplier, durationSeconds } = POTIONS[potion];
  const saves = (multiplier - 1) * durationSeconds;
  const slot = running.filter((i) => i.helper === kind);
  const main = slot.filter((i) => !i.extra);
  const idleBefore = main.reduce((sum, i) => sum + idleAt(i.finish, night), 0);

  let best: { ids: string[]; fix: Extract<BedtimeFix, { kind: "potion" }>; gain: number } | null = null;
  for (const target of overnight) {
    if (target.helper !== kind || fixes[target.id]) continue;
    // Latest moment it still gets the full boost; drinking later only helps less
    const useAt = target.finish - saves - durationSeconds;
    if (useAt < from || target.finish - saves > night.start) continue;
    const after = new Map(slot.map((i) => [i.id, boostedFinishTime(i.finish, useAt, multiplier, durationSeconds)]));
    const idleAfter = main.reduce((sum, i) => sum + idleAt(after.get(i.id)!, night), 0);
    const gain = idleBefore - idleAfter;
    if (gain <= 0 || (best && gain <= best.gain)) continue;
    best = {
      gain,
      ids: overnight.filter((i) => i.helper === kind && !fixes[i.id] && after.get(i.id)! < night.start).map((i) => i.id),
      fix: {
        kind: "potion",
        potion,
        useAt,
        newFinish: after.get(target.id)!,
        wasted: slot.some((i) => i.finish > useAt && i.finish - useAt < multiplier * durationSeconds),
        movesIntoNight: main.filter((i) => idleAt(i.finish, night) === 0 && idleAt(after.get(i.id)!, night) > 0).map((i) => i.id),
      },
    };
  }
  return best && { ids: best.ids, fix: best.fix };
}

/** Which helper / potion slot an upgrade is in: home builder or lab, else none. */
export function helperSlot(category: string, villageType: string): HelperKind | null {
  if (villageType !== "HOME") return null;
  return category === "BUILDER" ? "builder" : category === "LABORATORY" ? "lab" : null;
}

/**
 * One line per fix, player-friendly. `time` formats an epoch (a local clock on
 * the dashboard, a Discord <t:…:t> tag in messages); `labelOf` names upgrades
 * a potion would move into the night.
 */
export function describeFix(
  fix: BedtimeFix,
  time: (epoch: number) => string,
  labelOf: (id: string) => string | null = () => null
): string {
  switch (fix.kind) {
    case "stayUp":
      return `Stay up until ${time(fix.until)} and start the next one`;
    case "helper":
      return `Use your ${HELPER_NAMES[fix.helper]} by ${time(fix.useBy)}: done at ${time(fix.newFinish)}, before bed`;
    case "potion": {
      const moved = fix.movesIntoNight.map(labelOf).filter(Boolean);
      return [
        `Drink a ${POTIONS[fix.potion].label} at ${time(fix.useAt)}: done at ${time(fix.newFinish)}, before bed`,
        fix.wasted && " (some upgrades are too close to done to get all of it)",
        moved.length > 0 && `, but ${moved.join(" and ")} would then finish overnight`,
      ]
        .filter(Boolean)
        .join("");
    }
  }
}

/** The bedtime check goes out this long before the player's bedtime. */
export const BEDTIME_CHECK_LEAD_SECONDS = 3600;

/** Cheapest fix first: free (helper, staying up) before a potion. */
export const FIX_RANK: Record<BedtimeFix["kind"], number> = { helper: 0, stayUp: 1, potion: 2 };
