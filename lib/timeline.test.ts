import { describe, expect, it } from "vitest";
import { nightBands, nightWindow, planNight, stripPosition } from "./timeline";

const H = 3600;
const MIDNIGHT = 1_794_700_800; // a UTC midnight (multiple of 86400)

describe("nightWindow", () => {
  it("returns tonight when it hasn't started yet", () => {
    expect(nightWindow(MIDNIGHT + 20 * H, 0)).toEqual({ start: MIDNIGHT + 23 * H, end: MIDNIGHT + 31 * H });
  });

  it("returns the running night after midnight", () => {
    expect(nightWindow(MIDNIGHT + 2 * H, 0)).toEqual({ start: MIDNIGHT - H, end: MIDNIGHT + 7 * H });
  });

  it("moves to the next night once this one is over", () => {
    expect(nightWindow(MIDNIGHT + 8 * H, 0).start).toBe(MIDNIGHT + 23 * H);
  });

  it("uses the viewer's offset and custom hours", () => {
    // 20:00 UTC = 01:30 in UTC+5:30, inside a 00:00–08:00 night that started at 18:30 UTC
    const w = nightWindow(MIDNIGHT + 20 * H, 330, { startHour: 0, endHour: 8 });
    expect(w).toEqual({ start: MIDNIGHT + 18.5 * H, end: MIDNIGHT + 26.5 * H });
  });
});

describe("planNight", () => {
  const now = MIDNIGHT + 20 * H;
  const night = nightWindow(now, 0); // 23:00 → 07:00
  const at = (h: number, id: string) => ({ id, finish: MIDNIGHT + h * H });

  it("sorts running upgrades and totals the idle time", () => {
    const plan = planNight([at(30, "c"), at(22, "a"), at(25, "b"), at(19, "done"), at(40, "d")], night, now);
    expect(plan.beforeBed.map((i) => i.id)).toEqual(["a"]);
    expect(plan.overnight.map((o) => [o.item.id, o.idleSeconds / H])).toEqual([["b", 6], ["c", 1]]);
    expect(plan.allNight.map((i) => i.id)).toEqual(["d"]);
    expect(plan.idleSeconds).toBe(7 * H);
  });
});

describe("strip", () => {
  it("positions epochs on the 24h strip", () => {
    expect(stripPosition(MIDNIGHT + 6 * H, MIDNIGHT)).toBe(0.25);
    expect(stripPosition(MIDNIGHT + 30 * H, MIDNIGHT)).toBeNull();
  });

  it("shades the night bands inside the window", () => {
    expect(nightBands(MIDNIGHT + 20 * H, 0)).toEqual([{ start: 3 / 24, end: 11 / 24 }]);
    expect(nightBands(MIDNIGHT + 2 * H, 0)).toEqual([
      { start: 0, end: 5 / 24 },
      { start: 21 / 24, end: 1 },
    ]);
  });
});
