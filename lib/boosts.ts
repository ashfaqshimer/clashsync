/**
 * Boost (potion) timing math. Pure and client-safe. All times are Unix seconds.
 *
 * A boost makes work run `multiplier`× faster during a window of
 * `durationSeconds`. Applied to an upgrade with R seconds of normal-speed work
 * left when the window starts:
 *   - R ≤ multiplier × duration → finishes inside the window, after R / multiplier
 *   - otherwise                → finishes (multiplier − 1) × duration earlier
 */

export type PotionKind = "BUILDER_POTION" | "RESEARCH_POTION";

export interface PotionSpec {
  label: string;
  multiplier: number;
  durationSeconds: number;
  /** Which upgrades the potion speeds up. */
  category: "BUILDER" | "LABORATORY";
}

export const POTIONS: Record<PotionKind, PotionSpec> = {
  // All builders 10× for 1 hour → up to 9h saved per upgrade
  BUILDER_POTION: {
    label: "Builder Potion",
    multiplier: 10,
    durationSeconds: 3600,
    category: "BUILDER",
  },
  // Laboratory 24× for 1 hour → up to 23h saved
  RESEARCH_POTION: {
    label: "Research Potion",
    multiplier: 24,
    durationSeconds: 3600,
    category: "LABORATORY",
  },
};

/**
 * New finish time for an upgrade finishing at `finishTime`, given a boost
 * window starting at `windowStart`. Upgrades that finish before the window
 * starts are unaffected.
 */
export function boostedFinishTime(
  finishTime: number,
  windowStart: number,
  multiplier: number,
  durationSeconds: number
): number {
  const remaining = finishTime - windowStart;
  if (remaining <= 0) return finishTime;
  const boostedWork = multiplier * durationSeconds;
  return remaining <= boostedWork
    ? windowStart + Math.ceil(remaining / multiplier)
    : finishTime - (multiplier - 1) * durationSeconds;
}

/**
 * Potions stack: a new one starts when the current boost ends. Returns the
 * window the new potion covers.
 */
export function nextBoostWindow(
  now: number,
  currentBoostEndsAt: number | null,
  durationSeconds: number
): { start: number; end: number } {
  const start = Math.max(now, currentBoostEndsAt ?? 0);
  return { start, end: start + durationSeconds };
}
