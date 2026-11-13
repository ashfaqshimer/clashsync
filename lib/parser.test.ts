import { describe, expect, it } from "vitest";
import { formatDuration, parseVillageExport } from "./parser";
import { SAMPLE_VILLAGE_JSON } from "./sample-data";

const TS = 1_750_000_000;
const HOUR = 3600;

const parse = (village: object) => parseVillageExport(JSON.stringify(village));

describe("formatDuration", () => {
  it.each([
    [0, "0s"],
    [-5, "0s"],
    [45, "45s"],
    [125, "2m 5s"],
    [HOUR, "1h 0m"],
    [HOUR + 60 * 32, "1h 32m"],
    [86400, "1d 0h"],
    [2 * 86400 + 14 * HOUR + 32 * 60 + 10, "2d 14h 32m"],
  ])("%i → %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("parseVillageExport errors", () => {
  it("rejects empty input", () => {
    const r = parseVillageExport("   ");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/empty/i);
  });

  it("rejects malformed JSON", () => {
    const r = parseVillageExport("{not json");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/Invalid JSON/);
  });
});

describe("parseVillageExport", () => {
  it("only picks up items with a running timer", () => {
    const r = parse({
      tag: "#PY",
      timestamp: TS,
      buildings: [
        { data: 1000008, lvl: 20, timer: 500 },
        { data: 1000009, lvl: 13 },
        { data: 1000010, lvl: 19, timer: 0 },
      ],
    });
    expect(r.success).toBe(true);
    expect(r.playerTag).toBe("#PY");
    expect(r.totalActiveUpgrades).toBe(1);
    expect(r.upgrades[0]).toMatchObject({
      dataId: 1000008,
      name: "Cannon",
      category: "BUILDER",
      villageType: "HOME",
      currentLevel: 20,
      targetLevel: 21,
      remainingSeconds: 500,
      originalFinishTime: TS + 500,
      currentFinishTime: TS + 500,
    });
  });

  it("computes finish times from the export timestamp, in seconds", () => {
    const r = parse({ timestamp: TS, buildings: [{ data: 1000008, lvl: 1, timer: 2 * 86400 }] });
    expect(r.exportTimestamp).toBe(TS);
    expect(r.upgrades[0].originalFinishTime).toBe(TS + 2 * 86400);
  });

  it("falls back to now when the timestamp is missing or bogus", () => {
    const before = Math.floor(Date.now() / 1000);
    for (const timestamp of [undefined, 12345, "1750000000"]) {
      const r = parse({ timestamp, buildings: [{ data: 1000008, lvl: 1, timer: 60 }] });
      expect(r.exportTimestamp).toBeGreaterThanOrEqual(before);
      expect(r.upgrades[0].originalFinishTime).toBe(r.exportTimestamp! + 60);
    }
  });

  it("assigns categories by section", () => {
    const r = parse({
      timestamp: TS,
      buildings: [{ data: 1000008, lvl: 1, timer: 10 }],
      heroes: [{ data: 99999901, lvl: 1, timer: 20 }],
      units: [{ data: 99999902, lvl: 1, timer: 30 }],
      spells: [{ data: 99999903, lvl: 1, timer: 40 }],
      pets: [{ data: 99999904, lvl: 1, timer: 50 }],
      buildings2: [{ data: 99999905, lvl: 1, timer: 60 }],
      heroes2: [{ data: 99999906, lvl: 1, timer: 70 }],
      units2: [{ data: 99999907, lvl: 1, timer: 80 }],
    });
    const byId = Object.fromEntries(r.upgrades.map((u) => [u.dataId, u]));
    expect(byId[1000008].category).toBe("BUILDER");
    expect(byId[99999901].category).toBe("BUILDER");
    expect(byId[99999902].category).toBe("LABORATORY");
    expect(byId[99999903].category).toBe("LABORATORY");
    expect(byId[99999904].category).toBe("PET_HOUSE");
    expect(byId[99999906].category).toBe("BUILDER_BASE");
    expect(byId[99999907].category).toBe("BUILDER_BASE");
    for (const id of [99999905, 99999906, 99999907]) {
      expect(byId[id].villageType).toBe("BUILDER_BASE");
    }
    expect(r.builderUpgradesCount).toBe(2);
    expect(r.labUpgradesCount).toBe(2);
    expect(r.petUpgradesCount).toBe(1);
  });

  it("flags gear-ups and goblin/extra slots", () => {
    const r = parse({
      timestamp: TS,
      buildings: [
        { data: 1000013, lvl: 8, timer: 10, gear_up: 1 },
        { data: 1000003, lvl: 17, timer: 20, extra: true },
      ],
    });
    const [gear, extra] = r.upgrades;
    expect(gear.isGearUp).toBe(true);
    expect(gear.name).toContain("Gear-Up");
    expect(extra.isGoblinOrHelper).toBe(true);
    expect(extra.name).toContain("Goblin/Extra");
  });

  it("sorts upgrades soonest first", () => {
    const r = parse({
      timestamp: TS,
      buildings: [
        { data: 1000008, lvl: 1, timer: 300 },
        { data: 1000009, lvl: 1, timer: 100 },
      ],
      units: [{ data: 4000000, lvl: 1, timer: 200 }],
    });
    expect(r.upgrades.map((u) => u.remainingSeconds)).toEqual([100, 200, 300]);
  });

  it("reads the builder count from the Builder's Hut", () => {
    expect(parse({ timestamp: TS, buildings: [{ data: 1000015, lvl: 1, cnt: 6 }] }).builderHutCount).toBe(6);
    expect(parse({ timestamp: TS, buildings: [] }).builderHutCount).toBeUndefined();
  });

  it("applies a running builder potion to home builder upgrades only", () => {
    const r = parse({
      timestamp: TS,
      boosts: { builder_boost: HOUR },
      buildings: [{ data: 1000008, lvl: 1, timer: 2 * 86400 }],
      units: [{ data: 4000000, lvl: 1, timer: 2 * 86400 }],
      buildings2: [{ data: 99999905, lvl: 1, timer: 2 * 86400 }],
    });
    expect(r.builderBoostEndsAt).toBe(TS + HOUR);
    const home = r.upgrades.find((u) => u.category === "BUILDER")!;
    expect(home.originalFinishTime).toBe(TS + 2 * 86400);
    expect(home.currentFinishTime).toBe(TS + 2 * 86400 - 9 * HOUR);
    for (const u of r.upgrades.filter((u) => u.category !== "BUILDER")) {
      expect(u.currentFinishTime).toBe(u.originalFinishTime);
    }
  });

  it("uses only the boost time left at export", () => {
    // 10 minutes of potion left: saves 9 × 10m
    const r = parse({
      timestamp: TS,
      boosts: { builder_boost: 600 },
      buildings: [{ data: 1000008, lvl: 1, timer: 86400 }],
    });
    expect(r.upgrades[0].currentFinishTime).toBe(TS + 86400 - 9 * 600);
  });

  it("parses the bundled sample village", () => {
    const r = parseVillageExport(SAMPLE_VILLAGE_JSON);
    expect(r.success).toBe(true);
    expect(r.totalActiveUpgrades).toBeGreaterThan(0);
    for (const u of r.upgrades) {
      expect(u.originalFinishTime).toBe(r.exportTimestamp! + u.remainingSeconds);
    }
  });
});
