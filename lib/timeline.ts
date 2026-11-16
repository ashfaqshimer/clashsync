/**
 * Pure math for the dashboard's "Tonight" card: the viewer's next (or current)
 * night, which upgrades finish before it, during it (and so sit idle until
 * morning) or after it, and where finishes land on a 24h strip. All times are
 * Unix seconds; strip positions are fractions of the window (0–1).
 */

export const TIMELINE_WINDOW_SECONDS = 24 * 3600;

/** Default night: 23:00 → 07:00 viewer time. Players can change it on the card. */
export const DEFAULT_NIGHT = { startHour: 23, endHour: 7 } as const;

export interface NightHours {
  startHour: number;
  endHour: number;
}

/** Hours from bedtime to wake-up (handles nights that cross midnight). */
function nightLengthHours({ startHour, endHour }: NightHours): number {
  return (((endHour - startHour) % 24) + 24) % 24 || 24;
}

/**
 * The night that is running now, or else the next one, as epochs.
 * `offsetMinutes` is the viewer's UTC offset (east positive, i.e.
 * `-new Date().getTimezoneOffset()`).
 */
export function nightWindow(
  now: number,
  offsetMinutes: number,
  hours: NightHours = DEFAULT_NIGHT
): { start: number; end: number } {
  const offset = offsetMinutes * 60;
  const localNow = now + offset;
  const dayStart = localNow - (((localNow % 86400) + 86400) % 86400) - offset;
  const length = nightLengthHours(hours) * 3600;
  // Yesterday's night may still be running; otherwise today's or tomorrow's is next
  for (let d = -1; d <= 1; d++) {
    const start = dayStart + d * 86400 + hours.startHour * 3600;
    if (now < start + length) return { start, end: start + length };
  }
  const start = dayStart + 2 * 86400 + hours.startHour * 3600;
  return { start, end: start + length };
}

export interface NightPlan<T> {
  /** Finish before bedtime: start the next upgrade before going to sleep. */
  beforeBed: T[];
  /** Finish while asleep, with how long the slot then sits idle until wake-up. */
  overnight: Array<{ item: T; idleSeconds: number }>;
  /** Still working at wake-up. */
  allNight: T[];
  /** Total idle time across the overnight finishes. */
  idleSeconds: number;
}

/** Sorts running upgrades into before bed / overnight / all night. */
export function planNight<T extends { finish: number }>(
  items: T[],
  night: { start: number; end: number },
  now: number
): NightPlan<T> {
  const running = items.filter((i) => i.finish > now).sort((a, b) => a.finish - b.finish);
  const beforeBed = running.filter((i) => i.finish < night.start);
  const overnight = running
    .filter((i) => i.finish >= night.start && i.finish <= night.end)
    .map((item) => ({ item, idleSeconds: night.end - item.finish }));
  const allNight = running.filter((i) => i.finish > night.end);
  return {
    beforeBed,
    overnight,
    allNight,
    idleSeconds: overnight.reduce((sum, o) => sum + o.idleSeconds, 0),
  };
}

/** Position of an epoch on the strip [now, now + window], or null when outside it. */
export function stripPosition(epoch: number, now: number, windowSeconds = TIMELINE_WINDOW_SECONDS): number | null {
  const pos = (epoch - now) / windowSeconds;
  return pos < 0 || pos > 1 ? null : pos;
}

/**
 * Night bands inside the strip, as {start, end} fractions (at most two: the
 * current/next night and, for short nights, the one after).
 */
export function nightBands(
  now: number,
  offsetMinutes: number,
  hours: NightHours = DEFAULT_NIGHT,
  windowSeconds = TIMELINE_WINDOW_SECONDS
): Array<{ start: number; end: number }> {
  const bands: Array<{ start: number; end: number }> = [];
  let night = nightWindow(now, offsetMinutes, hours);
  while (night.start < now + windowSeconds) {
    bands.push({
      start: Math.max(0, (night.start - now) / windowSeconds),
      end: Math.min(1, (night.end - now) / windowSeconds),
    });
    night = { start: night.start + 86400, end: night.end + 86400 };
  }
  return bands;
}

/** How long before bedtime the dashboard moves the "Tonight" card to the top. */
export const EVENING_LEAD_HOURS = 3;

/**
 * True in the hours just before the viewer's bedtime, when planning the night
 * is the most useful thing on the dashboard. False once they're asleep.
 */
export function isEvening(
  now: number,
  offsetMinutes: number,
  hours: NightHours = DEFAULT_NIGHT,
  leadHours = EVENING_LEAD_HOURS
): boolean {
  const { start } = nightWindow(now, offsetMinutes, hours);
  return now < start && start - now <= leadHours * 3600;
}

/** Bedtimes and wake-up hours the night picker offers (and the server accepts). */
export const BEDTIME_HOURS = [20, 21, 22, 23, 0, 1, 2] as const;
export const WAKE_HOURS = [4, 5, 6, 7, 8, 9, 10, 11] as const;

export function isNightHours(value: unknown): value is NightHours {
  const v = value as Partial<NightHours> | null;
  return (
    typeof v === "object" &&
    v !== null &&
    (BEDTIME_HOURS as readonly number[]).includes(v.startHour as number) &&
    (WAKE_HOURS as readonly number[]).includes(v.endHour as number)
  );
}

/** True for an IANA time zone this runtime knows ("Asia/Colombo"). */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * UTC offset in minutes (east positive) of an IANA zone at an epoch, so the
 * server can work out a player's local night (daylight saving included).
 */
export function timeZoneOffsetMinutes(timeZone: string, epoch: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(epoch * 1000));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) / 1000;
  return Math.round((asUtc - epoch) / 60);
}
