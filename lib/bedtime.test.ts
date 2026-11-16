import { describe, expect, it } from "vitest";
import { planBedtime, type BedtimeItem } from "./bedtime";

const H = 3600;
const BED = 1_794_783_600; // 23:00
const night = { start: BED, end: BED + 8 * H }; // → 07:00
const now = BED - 3 * H; // 20:00

const item = (id: string, hoursAfterBed: number, helper: BedtimeItem["helper"] = "builder", extra = false) => ({
  id,
  finish: BED + hoursAfterBed * H,
  helper,
  extra,
});

describe("planBedtime", () => {
  it("suggests staying up for finishes just after bedtime", () => {
    const plan = planBedtime([item("a", 0.5, null), item("b", 3, null)], night, now);
    expect(plan.fixes).toEqual({ a: [{ kind: "stayUp", until: BED + 0.5 * H }] });
    expect(plan.fixable).toBe(1);
  });

  it("uses a helper to pull an overnight finish before bed, without wasting it", () => {
    // Apprentice lvl 4 saves 4h: a 2 AM finish becomes 10 PM; use it by 9 PM
    const plan = planBedtime([item("a", 3)], night, now, { builder: { level: 4, readyAt: now - H } });
    expect(plan.fixes.a).toEqual([{ kind: "helper", helper: "builder", useBy: BED - 2 * H, newFinish: BED - H }]);
    expect(plan.helperTips).toEqual([]);
  });

  it("doesn't offer a helper that can't make it before bed or isn't ready in time", () => {
    const tooLate = planBedtime([item("a", 5)], night, now, { builder: { level: 4, readyAt: now } });
    expect(tooLate.fixes.a).toBeUndefined();
    // Ready at 10:30 PM, but must be used by 9 PM to keep its full value
    const notReady = planBedtime([item("a", 3)], night, now, { builder: { level: 4, readyAt: BED - 0.5 * H } });
    expect(notReady.fixes.a).toBeUndefined();
  });

  it("gives each helper to the upgrade that would sit idle longest, and only matching slots", () => {
    // At 5 PM a lvl 8 Apprentice (9h incl. its hour) fits 2 AM–7 AM finishes; a lvl 12 Assistant 6 AM–7 AM
    const plan = planBedtime(
      [item("lab", 7.5, "lab"), item("late", 6), item("early", 3.5), item("pet", 1, null)],
      night,
      BED - 6 * H,
      { builder: { level: 8, readyAt: 0 }, lab: { level: 12, readyAt: 0 } }
    );
    expect(plan.fixes.early).toEqual([expect.objectContaining({ kind: "helper", helper: "builder" })]);
    expect(plan.fixes.late).toBeUndefined();
    expect(plan.fixes.lab).toEqual([expect.objectContaining({ kind: "helper", helper: "lab" })]);
    expect(plan.fixes.pet).toEqual([{ kind: "stayUp", until: BED + H }]);
    expect(plan.fixable).toBe(3);
  });

  it("saves the helper for an upgrade that staying up can't fix", () => {
    const plan = planBedtime([item("soon", 0.5), item("later", 4)], night, BED - 6 * H, {
      builder: { level: 5, readyAt: 0 },
    });
    expect(plan.fixes.soon).toEqual([{ kind: "stayUp", until: BED + 0.5 * H }]);
    expect(plan.fixes.later).toEqual([expect.objectContaining({ kind: "helper", newFinish: BED - H })]);
    expect(plan.fixable).toBe(2);
  });

  it("skips Goblin slots and finished upgrades", () => {
    const plan = planBedtime([item("gob", 0.5, "builder", true), { id: "done", finish: now - 1, helper: null }], night, now);
    expect(plan.fixes).toEqual({});
  });

  it("points an unused helper at the longest upgrade where its full value counts", () => {
    const plan = planBedtime(
      [item("short", -2.5), item("long", 30), item("lab", 20, "lab")],
      night,
      now,
      { builder: { level: 8, readyAt: now }, lab: { level: 12, readyAt: BED + 16 * H } }
    );
    expect(plan.helperTips).toEqual([
      { helper: "builder", ready: true, readyAt: now, suggestId: "long" },
      // Ready tomorrow afternoon: only 4h of research left by then, under 13h
      { helper: "lab", ready: false, readyAt: BED + 16 * H, suggestId: null },
    ]);
  });
});
