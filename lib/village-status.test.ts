import { describe, expect, it } from "vitest";
import { formatAge, villageStatus } from "./village-status";

describe("formatAge", () => {
  it("rounds to the unit that matters", () => {
    expect(formatAge(20)).toBe("just now");
    expect(formatAge(25 * 60 + 7)).toBe("25m ago");
    expect(formatAge(3 * 3600 + 12 * 60 + 40)).toBe("3h 12m ago");
    expect(formatAge(86400 + 12 * 3600 + 55 * 60)).toBe("1d 12h ago");
    expect(formatAge(2 * 86400 + 30 * 60)).toBe("2d 0h ago");
  });
});

describe("villageStatus", () => {
  const NOW = 1_000_000;
  const base = { builderCount: 3, builderFinishTimes: [], finishTimes: [], lastExportTimestamp: NOW - 60 };

  it("counts idle builders and the next running finish", () => {
    const s = villageStatus(
      { ...base, builderFinishTimes: [NOW + 100, NOW - 5], finishTimes: [NOW + 100, NOW - 5, NOW + 50] },
      NOW
    );
    expect(s.busyBuilders).toBe(1);
    expect(s.idleBuilders).toBe(2);
    expect(s.running).toBe(2);
    expect(s.nextFinishTime).toBe(NOW + 50);
    expect(s.needsAttention).toBe(true);
  });

  it("never reports fewer builders than are busy (B.O.B.)", () => {
    const times = [NOW + 1, NOW + 2, NOW + 3, NOW + 4];
    const s = villageStatus({ ...base, builderFinishTimes: times, finishTimes: times }, NOW);
    expect(s.idleBuilders).toBe(0);
    expect(s.needsAttention).toBe(false);
  });

  it("flags nothing running and stale exports", () => {
    expect(villageStatus({ ...base, builderCount: null }, NOW).needsAttention).toBe(true);
    const busy = [NOW + 1, NOW + 2, NOW + 3];
    const stale = villageStatus(
      { ...base, builderFinishTimes: busy, finishTimes: busy, lastExportTimestamp: NOW - 13 * 3600 },
      NOW
    );
    expect(stale.stale).toBe(true);
    expect(stale.needsAttention).toBe(true);
  });
});
