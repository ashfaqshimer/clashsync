import { describe, expect, it } from "vitest";
import { alertCutoff, alertMessage, carryOverNotified, isAlertLead, SWEEP_INTERVAL_SECONDS } from "./alerts";

const NOW = 1_750_000_000;
const LINK = "https://example.test/v/PY";

describe("alertCutoff", () => {
  it("alerts at finish time when the lead is 0", () => {
    expect(alertCutoff(NOW, 0)).toBe(NOW);
  });

  it("adds one sweep interval so the alert is never later than the lead", () => {
    expect(alertCutoff(NOW, 5)).toBe(NOW + 5 * 60 + SWEEP_INTERVAL_SECONDS);
  });

  it("guarantees at least `lead` minutes of warning across consecutive sweeps", () => {
    const lead = 5;
    // An upgrade finishing just after one sweep's cutoff is caught by the next
    const finish = alertCutoff(NOW, lead) + 1;
    const nextSweep = NOW + SWEEP_INTERVAL_SECONDS;
    expect(finish).toBeLessThanOrEqual(alertCutoff(nextSweep, lead));
    expect(finish - nextSweep).toBeGreaterThanOrEqual(lead * 60);
  });
});

describe("isAlertLead", () => {
  it("accepts only the offered options", () => {
    expect(isAlertLead(5)).toBe(true);
    expect(isAlertLead(0)).toBe(true);
    expect(isAlertLead(7)).toBe(false);
    expect(isAlertLead("5")).toBe(false);
  });
});

describe("alertMessage", () => {
  const cannon = { entityName: "Cannon", targetLevel: 21, currentFinishTime: NOW + 300 };

  it("announces an upcoming finish with a live Discord countdown", () => {
    const msg = alertMessage("#PY", [cannon], NOW, LINK);
    expect(msg).toContain("⏰");
    expect(msg).toContain("**Cannon Level 21** finishes <t:1750000300:R> (at <t:1750000300:t>)");
    expect(msg).toContain(LINK);
  });

  it("says ready when it already finished", () => {
    const msg = alertMessage("#PY", [{ ...cannon, currentFinishTime: NOW - 10 }], NOW, LINK);
    expect(msg).toContain("🔨");
    expect(msg).toContain("is ready");
  });

  it("lists several upgrades, capped at 15 lines", () => {
    const items = Array.from({ length: 17 }, (_, i) => ({ ...cannon, currentFinishTime: NOW + i }));
    const msg = alertMessage("#PY", items, NOW, LINK);
    expect(msg).toContain("**17 upgrades** are about to finish");
    expect(msg).toContain("…and 2 more");
    expect(msg.match(/^• /gm)).toHaveLength(15);
  });
});

describe("carryOverNotified", () => {
  const wall = { dataId: 1000010, targetLevel: 15, villageType: "HOME", isGearUp: false };
  const at = new Date("2026-01-01T00:00:00Z");

  it("keeps the alerted mark for the same upgrade after a re-sync", () => {
    expect(carryOverNotified([{ ...wall, notifiedAt: at }], [wall])).toEqual([at]);
  });

  it("ignores previous upgrades that weren't alerted, or differ", () => {
    const prev = [
      { ...wall, notifiedAt: null },
      { ...wall, targetLevel: 16, notifiedAt: at },
      { ...wall, isGearUp: true, notifiedAt: at },
    ];
    expect(carryOverNotified(prev, [wall])).toEqual([null]);
  });

  it("matches one-to-one", () => {
    expect(carryOverNotified([{ ...wall, notifiedAt: at }], [wall, wall])).toEqual([at, null]);
  });
});
