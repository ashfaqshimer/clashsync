import { describe, expect, it } from "vitest";
import {
  alertCutoff,
  alertMessage,
  carryOverNotified,
  freedSummary,
  idleReminderMessage,
  isAlertLead,
  SWEEP_INTERVAL_SECONDS,
} from "./alerts";

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
    expect(msg).toContain("**Cannon Level 21**: done <t:1750000300:R> (at <t:1750000300:t>)");
    expect(msg).toContain("#PY");
    expect(msg).toContain(LINK);
  });

  it("says ready when it already finished", () => {
    const msg = alertMessage("#PY", [{ ...cannon, currentFinishTime: NOW - 10 }], NOW, LINK);
    expect(msg).toContain("🔨");
    expect(msg).toContain("is ready");
  });

  // The message text is frozen at send time but <t:…:R> keeps updating, so a
  // countdown must read right later too ("done 29 minutes ago", never "finishes 29 minutes ago").
  it("words every countdown so it still reads right after the finish", () => {
    const single = alertMessage("#PY", [cannon], NOW, LINK);
    const many = alertMessage("#PY", [cannon, { ...cannon, currentFinishTime: NOW - 60 }], NOW, LINK);
    for (const msg of [single, many]) {
      expect(msg).not.toMatch(/finish(es)? <t:/);
      expect(msg).not.toMatch(/about to finish/);
      for (const [, before] of msg.matchAll(/(\S+) <t:\d+:R>/g)) expect(before).toBe("done");
    }
  });

  it("lists several upgrades, capped at 15 lines", () => {
    const items = Array.from({ length: 17 }, (_, i) => ({ ...cannon, currentFinishTime: NOW + i }));
    const msg = alertMessage("#PY", items, NOW, LINK);
    expect(msg).toContain("**17 upgrades** to check");
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

describe("freedSummary", () => {
  it("counts one builder per finished builder upgrade and names single buildings", () => {
    expect(freedSummary([{ category: "LABORATORY", currentFinishTime: 1 }])).toBe("your Laboratory");
    expect(
      freedSummary([
        { category: "BUILDER", currentFinishTime: 1 },
        { category: "BUILDER", currentFinishTime: 2 },
        { category: "LABORATORY", currentFinishTime: 3 },
        { category: "PET_HOUSE", currentFinishTime: 4 },
      ])
    ).toBe("2 builders, your Laboratory and your Pet House");
    expect(freedSummary([{ category: "BUILDER_BASE", currentFinishTime: 1 }])).toBe("1 Builder Base upgrade");
  });
});

describe("idleReminderMessage", () => {
  it("uses the earliest finish as a live Discord timestamp and asks for a fresh export", () => {
    const msg = idleReminderMessage(
      "#PYL",
      [
        { category: "BUILDER", currentFinishTime: 2000 },
        { category: "LABORATORY", currentFinishTime: 1000 },
      ],
      "https://example.com/v/PYL"
    );
    expect(msg).toContain("1 builder and your Laboratory finished <t:1000:R>");
    expect(msg).toContain("#PYL");
    expect(msg).toContain("fresh export");
    expect(msg.endsWith("https://example.com/v/PYL")).toBe(true);
  });
});
