/**
 * Alert timing and wording. Pure and client-safe (the alerts card imports the
 * lead-time options). All times are Unix seconds.
 *
 * Alerts go out *before* an upgrade finishes, so the player can open the game
 * in time. The sweep only runs every SWEEP_INTERVAL_SECONDS, so an upgrade is
 * picked up once it finishes within `lead + interval`: the message always
 * arrives between `lead` and `lead + interval` before the finish, never later.
 */

/** Must match the QStash schedule in scripts/setup-qstash-schedule.ts. */
export const SWEEP_INTERVAL_SECONDS = 120;

/** Minutes before the finish. 0 = when it's done. */
export const ALERT_LEAD_OPTIONS = [0, 2, 5, 10, 15, 30] as const;
export const DEFAULT_ALERT_LEAD_MINUTES = 5;

export function isAlertLead(value: unknown): value is (typeof ALERT_LEAD_OPTIONS)[number] {
  return ALERT_LEAD_OPTIONS.includes(value as (typeof ALERT_LEAD_OPTIONS)[number]);
}

export function alertLeadLabel(minutes: number): string {
  return minutes === 0 ? "When it's done" : `${minutes} min before`;
}

/** Upgrades finishing at or before this get alerted in a sweep at `now`. */
export function alertCutoff(now: number, leadMinutes: number): number {
  return now + leadMinutes * 60 + (leadMinutes > 0 ? SWEEP_INTERVAL_SECONDS : 0);
}

export interface AlertItem {
  entityName: string;
  targetLevel: number;
  currentFinishTime: number;
}

const MAX_LINES = 15;

/**
 * Discord timestamps (`<t:…:R>` / `<t:…:t>`) render in each reader's own
 * timezone and keep counting down live, so "in 4 minutes" stays accurate.
 */
function when(finish: number, now: number): string {
  return finish <= now ? `is ready (<t:${finish}:R>)` : `finishes <t:${finish}:R> (at <t:${finish}:t>)`;
}

/** Items must be sorted by finish time. */
export function alertMessage(tag: string, items: AlertItem[], now: number, link: string): string {
  if (items.length === 1) {
    const [u] = items;
    const icon = u.currentFinishTime <= now ? "🔨" : "⏰";
    return `${icon} Chief, your **${u.entityName} Level ${u.targetLevel}** ${when(u.currentFinishTime, now)}! (${tag})\n${link}`;
  }
  const allDone = items.every((u) => u.currentFinishTime <= now);
  const lines = items
    .slice(0, MAX_LINES)
    .map((u) => `• ${u.entityName} → Level ${u.targetLevel} ${when(u.currentFinishTime, now)}`);
  if (items.length > MAX_LINES) lines.push(`…and ${items.length - MAX_LINES} more`);
  const headline = allDone
    ? `🔨 Chief, **${items.length} upgrades** are ready!`
    : `⏰ Chief, **${items.length} upgrades** are about to finish!`;
  return `${headline} (${tag})\n${lines.join("\n")}\n${link}`;
}

export interface UpgradeIdentity {
  dataId: number;
  targetLevel: number;
  villageType: string;
  isGearUp: boolean;
}

const identityKey = (u: UpgradeIdentity) =>
  `${u.dataId}|${u.targetLevel}|${u.villageType}|${u.isGearUp ? 1 : 0}`;

/**
 * A re-sync replaces every upgrade row, so without this an upgrade that was
 * already alerted would be alerted again (likely, since players re-sync right
 * when they open the game after an early alert). Returns, for each new
 * upgrade, the `notifiedAt` of a matching already-alerted previous one.
 * Matches are one-to-one, so two identical walls only inherit one mark each.
 */
export function carryOverNotified<T extends UpgradeIdentity>(
  previous: (UpgradeIdentity & { notifiedAt: Date | null })[],
  next: T[]
): (Date | null)[] {
  const pool = new Map<string, Date[]>();
  for (const p of previous) {
    if (!p.notifiedAt) continue;
    const key = identityKey(p);
    pool.set(key, [...(pool.get(key) ?? []), p.notifiedAt]);
  }
  return next.map((n) => pool.get(identityKey(n))?.shift() ?? null);
}
