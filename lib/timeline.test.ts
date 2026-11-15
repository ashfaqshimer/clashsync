import { describe, expect, it } from "vitest";
import { finishesOvernight, nightBands, timelineBar } from "./timeline";

const H = 3600;
const MIDNIGHT = 1_794_700_800; // a UTC midnight (multiple of 86400)

describe("timelineBar", () => {
  it("places the finish as a fraction of 24h and caps it", () => {
    expect(timelineBar(MIDNIGHT + 6 * H, MIDNIGHT)).toEqual({ end: 0.25, beyond: false });
    expect(timelineBar(MIDNIGHT + 30 * H, MIDNIGHT)).toEqual({ end: 1, beyond: true });
    expect(timelineBar(MIDNIGHT - H, MIDNIGHT).end).toBe(0);
  });
});

describe("nightBands", () => {
  it("covers 23:00–07:00 local inside the window (UTC)", () => {
    // now = 20:00 UTC → night from +3h to +11h
    const bands = nightBands(MIDNIGHT + 20 * H, 0);
    expect(bands).toEqual([{ start: 3 / 24, end: 11 / 24 }]);
  });

  it("clips a night that is already running", () => {
    // now = 02:00 → night until +5h, next one from +21h to the window's end
    const bands = nightBands(MIDNIGHT + 2 * H, 0);
    expect(bands).toEqual([
      { start: 0, end: 5 / 24 },
      { start: 21 / 24, end: 1 },
    ]);
  });

  it("uses the viewer's offset", () => {
    // 20:00 UTC is 01:30 in UTC+5:30 → night until 07:00 local = +5.5h
    const bands = nightBands(MIDNIGHT + 20 * H, 330);
    expect(bands[0]).toEqual({ start: 0, end: 5.5 / 24 });
  });
});

describe("finishesOvernight", () => {
  it("flags finishes inside the night band only", () => {
    const now = MIDNIGHT + 20 * H;
    expect(finishesOvernight(now + 5 * H, now, 0)).toBe(true); // 01:00
    expect(finishesOvernight(now + 13 * H, now, 0)).toBe(false); // 09:00
  });
});
