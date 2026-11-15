/**
 * Pure math for the dashboard's "next 24 hours" strip: where each running
 * upgrade's bar ends, and which parts of the window are night-time. All times
 * are Unix seconds; positions are fractions of the window (0–1).
 */

export const TIMELINE_WINDOW_SECONDS = 24 * 3600;

/** Local hours treated as "while you sleep" (23:00 → 07:00). */
export const NIGHT_START_HOUR = 23;
export const NIGHT_END_HOUR = 7;

export interface TimelineBar {
  /** 0–1 position of the finish, capped at 1. */
  end: number;
  /** Finishes after the window ends. */
  beyond: boolean;
}

export function timelineBar(finish: number, now: number, windowSeconds = TIMELINE_WINDOW_SECONDS): TimelineBar {
  const end = (finish - now) / windowSeconds;
  return { end: Math.min(1, Math.max(0, end)), beyond: end > 1 };
}

/**
 * Night bands inside [now, now + window], as {start, end} fractions.
 * `offsetMinutes` is the viewer's UTC offset (east positive, i.e.
 * `-new Date().getTimezoneOffset()`).
 */
export function nightBands(
  now: number,
  offsetMinutes: number,
  windowSeconds = TIMELINE_WINDOW_SECONDS
): Array<{ start: number; end: number }> {
  const offset = offsetMinutes * 60;
  const localNow = now + offset;
  const dayStart = localNow - (((localNow % 86400) + 86400) % 86400);
  const bands: Array<{ start: number; end: number }> = [];
  // Nights starting yesterday through tomorrow cover any 24h window
  for (let d = -1; d <= 1; d++) {
    const start = dayStart + d * 86400 + NIGHT_START_HOUR * 3600 - offset;
    const end = dayStart + (d + 1) * 86400 + NIGHT_END_HOUR * 3600 - offset;
    const s = Math.max(0, (start - now) / windowSeconds);
    const e = Math.min(1, (end - now) / windowSeconds);
    if (e > s) bands.push({ start: s, end: e });
  }
  return bands;
}

/** True when `finish` lands in a night band (the slot then sits idle until morning). */
export function finishesOvernight(finish: number, now: number, offsetMinutes: number): boolean {
  const pos = (finish - now) / TIMELINE_WINDOW_SECONDS;
  return nightBands(now, offsetMinutes).some((b) => pos >= b.start && pos <= b.end);
}
