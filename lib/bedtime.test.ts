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
    // The Apprentice is taken, so a Builder Potion is the way to fix the other one
    expect(plan.fixes.late?.map((f) => f.kind)).toEqual(["potion"]);
    expect(plan.fixes.lab).toEqual([expect.objectContaining({ kind: "helper", helper: "lab" })]);
    expect(plan.fixes.pet).toEqual([{ kind: "stayUp", until: BED + H }]);
    expect(plan.fixable).toBe(4);
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

describe("planBedtime potions", () => {
  const evening = BED - 6 * H; // 5 PM
  const potionOf = (plan: ReturnType<typeof planBedtime>, id: string) => plan.fixes[id]?.find((f) => f.kind === "potion");

  it("suggests a Builder Potion that pulls an overnight finish before bed", () => {
    // 4 AM finish: drink by 6 PM (10h left = full boost) and it's done at 7 PM
    const plan = planBedtime([item("a", 5), item("b", 20)], night, evening);
    expect(plan.fixes.a).toEqual([
      { kind: "potion", potion: "BUILDER_POTION", useAt: BED - 5 * H, newFinish: BED - 4 * H, wasted: false, movesIntoNight: [] },
    ]);
    expect(plan.fixable).toBe(1);
  });

  it("names upgrades the potion would move into the night, and skips it when the night gets no better", () => {
    const worth = planBedtime([item("a", 5), item("c", 16)], night, evening);
    expect(potionOf(worth, "a")).toMatchObject({ movesIntoNight: ["c"] });
    // c would sit idle as long as a does now: no gain
    expect(planBedtime([item("a", 5), item("c", 14)], night, evening).fixes).toEqual({});
  });

  it("flags waste on builders that are nearly done", () => {
    expect(potionOf(planBedtime([item("a", 5), item("d", -4)], night, evening), "a")).toMatchObject({ wasted: true });
  });

  it("only offers a potion where no free fix exists", () => {
    const plan = planBedtime([item("a", 5)], night, evening, { builder: { level: 8, readyAt: 0 } });
    expect(plan.fixes.a?.map((f) => f.kind)).toEqual(["helper"]);
  });

  it("starts after a potion that is still running", () => {
    expect(planBedtime([item("a", 5)], night, evening, {}, { builder: BED - 4 * H }).fixes).toEqual({});
  });

  it("uses the Research Potion for the lab", () => {
    const plan = planBedtime([item("r", 7, "lab"), item("pet", 2, null)], night, BED - 20 * H);
    expect(plan.fixes.r).toEqual([expect.objectContaining({ potion: "RESEARCH_POTION", newFinish: BED - 16 * H })]);
    expect(plan.fixes.pet).toBeUndefined();
  });
});

describe("bedtimeCheckMessage", () => {
  it("lists each overnight slot with its cheapest fix in Discord time tags", async () => {
    const { bedtimeCheckMessage } = await import("./alerts");
    const msg = bedtimeCheckMessage(
      "#PYL",
      [
        { label: "Cannon", finish: BED + 0.5 * H, fix: { kind: "stayUp", until: BED + 0.5 * H } },
        { label: "Unicorn", finish: BED + 3 * H, fix: null },
      ],
      BED + 8 * H,
      "https://example.test/v/PYL#tonight"
    );
    expect(msg).toBe(
      "🌙 Bedtime check · #PYL\n" +
        "2 slots go idle tonight, about 13h before you're up. 1 can be fixed:\n" +
        `• **Cannon** done <t:${BED + 0.5 * H}:t>: Stay up until <t:${BED + 0.5 * H}:t> and start the next one\n` +
        `• **Unicorn** done <t:${BED + 3 * H}:t>: idle until <t:${BED + 8 * H}:t>\n` +
        "https://example.test/v/PYL#tonight"
    );
  });
});

describe("applyHelper", () => {
  it("takes level hours off and starts the shared daily clock", async () => {
    const { applyHelper } = await import("./bedtime");
    expect(applyHelper(now + 20 * H, now, 8, null)).toEqual({ newFinish: now + 12 * H, readyAt: now + 23 * H });
    // Nearly done: finishes within the hour instead
    expect(applyHelper(now + 4.5 * H, now, 8, null).newFinish).toBe(now + 0.5 * H);
    // The other helper already started today's clock
    expect(applyHelper(now + 20 * H, now, 8, now + 5 * H).readyAt).toBe(now + 5 * H);
    expect(applyHelper(now + 20 * H, now, 8, now - H).readyAt).toBe(now + 23 * H);
  });
});
