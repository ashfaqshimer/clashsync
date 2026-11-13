import { describe, expect, it } from "vitest";
import { boostedFinishTime, finishWithRunningBoost, nextBoostWindow, POTIONS } from "./boosts";

const HOUR = 3600;

describe("boostedFinishTime", () => {
  const { multiplier, durationSeconds } = POTIONS.BUILDER_POTION; // 10× for 1h

  it("leaves upgrades that finish before the window untouched", () => {
    expect(boostedFinishTime(1000, 2000, multiplier, durationSeconds)).toBe(1000);
    expect(boostedFinishTime(2000, 2000, multiplier, durationSeconds)).toBe(2000);
  });

  it("finishes inside the window when the work fits", () => {
    // 5h of work at 10× takes 30m
    expect(boostedFinishTime(5 * HOUR, 0, multiplier, durationSeconds)).toBe(HOUR / 2);
  });

  it("rounds a partial second up", () => {
    expect(boostedFinishTime(15, 0, multiplier, durationSeconds)).toBe(2);
  });

  it("finishes exactly at the window end on the boundary", () => {
    expect(boostedFinishTime(10 * HOUR, 0, multiplier, durationSeconds)).toBe(HOUR);
  });

  it("saves (multiplier − 1) × duration on long upgrades", () => {
    expect(boostedFinishTime(2 * 86400, 0, multiplier, durationSeconds)).toBe(2 * 86400 - 9 * HOUR);
  });

  it("saves up to 23h with a Research Potion", () => {
    const r = POTIONS.RESEARCH_POTION;
    expect(boostedFinishTime(3 * 86400, 0, r.multiplier, r.durationSeconds)).toBe(3 * 86400 - 23 * HOUR);
  });

  it("measures remaining work from the window start", () => {
    const start = 1_700_000_000;
    expect(boostedFinishTime(start + 2 * HOUR, start, multiplier, durationSeconds)).toBe(start + 720);
  });
});

describe("nextBoostWindow", () => {
  it("starts now when no boost is running", () => {
    expect(nextBoostWindow(100, null, HOUR)).toEqual({ start: 100, end: 100 + HOUR });
  });

  it("starts now when the previous boost already ended", () => {
    expect(nextBoostWindow(100, 50, HOUR)).toEqual({ start: 100, end: 100 + HOUR });
  });

  it("stacks after a boost that is still running", () => {
    expect(nextBoostWindow(100, 500, HOUR)).toEqual({ start: 500, end: 500 + HOUR });
  });
});

describe("finishWithRunningBoost", () => {
  const { multiplier } = POTIONS.RESEARCH_POTION; // 24×
  const EXPORT = 1_000_000;

  it("leaves the timer alone when no boost is running at export", () => {
    expect(finishWithRunningBoost(EXPORT + 86400, EXPORT, null, multiplier)).toBe(EXPORT + 86400);
    expect(finishWithRunningBoost(EXPORT + 86400, EXPORT, EXPORT - 1, multiplier)).toBe(EXPORT + 86400);
  });

  it("applies only the part of the boost left after the export", () => {
    // 30 min of potion left saves 23 × 30 min
    expect(finishWithRunningBoost(EXPORT + 86400, EXPORT, EXPORT + 1800, multiplier)).toBe(
      EXPORT + 86400 - 23 * 1800
    );
  });

  it("handles stacked potions as one longer window", () => {
    expect(finishWithRunningBoost(EXPORT + 3 * 86400, EXPORT, EXPORT + 2 * HOUR, multiplier)).toBe(
      EXPORT + 3 * 86400 - 23 * 2 * HOUR
    );
  });
});
