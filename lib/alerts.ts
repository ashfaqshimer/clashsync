/**
 * Alert timing and wording. Pure and client-safe (the alerts card imports the
 * lead-time options). All times are Unix seconds.
 *
 * Alerts go out *before* an upgrade finishes, so the player can open the game
 * in time. The sweep only runs every SWEEP_INTERVAL_SECONDS, so an upgrade is
 * picked up once it finishes within `lead + interval`: the message always
 * arrives between `lead` and `lead + interval` before the finish, never later.
 */

import type { UpgradeType } from "./types";

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
 * timezone and keep updating after the message is sent. The text around them
 * can't change, so it must read right both before and after the finish:
 * "done in 4 minutes" → later "done 29 minutes ago". Never "finishes <t:R>".
 */
function done(finish: number): string {
  return `done <t:${finish}:R> (at <t:${finish}:t>)`;
}

/** Items must be sorted by finish time. */
export function alertMessage(tag: string, items: AlertItem[], now: number, link: string): string {
  if (items.length === 1) {
    const [u] = items;
    const item = `**${u.entityName} Level ${u.targetLevel}**`;
    // Wording is frozen at send time, so only claim "ready" if it already is
    const headline =
      u.currentFinishTime <= now
        ? `🔨 Chief, your ${item} is ready! It was ${done(u.currentFinishTime)}.`
        : `⏰ Heads-up, Chief! ${item}: ${done(u.currentFinishTime)}.`;
    return `${headline} · ${tag}\n${link}`;
  }
  const allDone = items.every((u) => u.currentFinishTime <= now);
  const lines = items
    .slice(0, MAX_LINES)
    .map((u) => `• ${u.entityName} → Level ${u.targetLevel}: ${done(u.currentFinishTime)}`);
  if (items.length > MAX_LINES) lines.push(`…and ${items.length - MAX_LINES} more`);
  const headline = allDone
    ? `🔨 Chief, **${items.length} upgrades** are ready!`
    : `⏰ Heads-up, Chief! **${items.length} upgrades** to check:`;
  return `${headline} · ${tag}\n${lines.join("\n")}\n${link}`;
}

/**
 * Idle nudge: an upgrade finished this long ago and the player hasn't
 * re-synced since (a sync replaces every row, so a finished row still being
 * there means no newer export). The builder or lab that did it may be sitting
 * idle. At most one nudge per sync (`villages.idle_reminded_at`).
 */
export const IDLE_AFTER_SECONDS = 60 * 60;
/**
 * Only finishes in [now - IDLE_AFTER - window, now - IDLE_AFTER] trigger a
 * nudge, so syncing an old export (finishes long past) never sends one.
 */
export const IDLE_WINDOW_SECONDS = 30 * 60;

export interface IdleItem {
  category: UpgradeType;
  currentFinishTime: number;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "your Laboratory and 2 builders". Each finished main-slot upgrade freed one builder. */
export function freedSummary(items: IdleItem[]): string {
  const count = (c: UpgradeType) => items.filter((i) => i.category === c).length;
  const parts = [
    count("BUILDER") > 0 && plural(count("BUILDER"), "builder"),
    count("LABORATORY") > 0 && "your Laboratory",
    count("PET_HOUSE") > 0 && "your Pet House",
    count("BUILDER_BASE") > 0 && plural(count("BUILDER_BASE"), "Builder Base upgrade"),
    count("OTHER") > 0 && plural(count("OTHER"), "other upgrade"),
  ].filter((p): p is string => Boolean(p));
  if (parts.length <= 1) return parts[0] ?? "an upgrade";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** Items must be non-empty. Wording stays true however late the reader opens it. */
export function idleReminderMessage(tag: string, items: IdleItem[], link: string): string {
  const since = Math.min(...items.map((i) => i.currentFinishTime));
  return (
    `💤 Chief, anything sitting idle? ${freedSummary(items)} finished <t:${since}:R> and you haven't synced since. · ${tag}\n` +
    `Started something new already? Paste a fresh export so ClashSync can track it.\n${link}`
  );
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
