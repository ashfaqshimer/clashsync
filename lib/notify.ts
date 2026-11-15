import { and, eq, exists, inArray, isNotNull, isNull, lte, not, or, sql, between } from "drizzle-orm";
import { db } from "@/lib/db";
import { authAccounts, upgrades, villages } from "@/lib/db/schema";
import { appUrl } from "@/lib/app-url";
import {
  alertMessage,
  IDLE_AFTER_SECONDS,
  IDLE_WINDOW_SECONDS,
  idleReminderMessage,
  SWEEP_INTERVAL_SECONDS,
} from "@/lib/alerts";
import { sendDiscordDm, sendDiscordMessage } from "@/lib/discord";
import { tagToSlug } from "@/lib/tags";
import { openWebhookUrl } from "@/lib/secrets";
import { upgradeLabel } from "@/lib/upgrade-label";

/** Finished longer ago than this (cron gap, old export re-synced) → don't announce. */
const STALE_AFTER_SECONDS = 30 * 60;

interface Finished {
  id: string;
  villageId: string;
  entityName: string;
  isGearUp: boolean;
  isExtraSlot: boolean;
  targetLevel: number;
  currentFinishTime: number;
}

export { appUrl };

export interface SweepSummary {
  claimed: number;
  sent: number;
  skippedStale: number;
  skippedNoDestination: number;
  failed: number;
  retrying: number;
}

interface Recipient {
  playerTag: string;
  webhook: string | null; // Sealed (lib/secrets.ts)
  dmAlerts: boolean;
  discordId: string | null;
}

type Outcome = "sent" | "retry" | "failed" | "no_destination";

/** Webhook and/or DM destinations for some villages, by village id. */
async function loadRecipients(villageIds: string[]): Promise<Map<string, Recipient>> {
  const rows = await db
    .select({
      id: villages.id,
      playerTag: villages.playerTag,
      webhook: villages.discordWebhookUrl,
      dmAlerts: villages.dmAlerts,
      discordId: authAccounts.accountId,
    })
    .from(villages)
    .leftJoin(
      authAccounts,
      and(eq(authAccounts.userId, villages.ownerId), eq(authAccounts.providerId, "discord"))
    )
    .where(inArray(villages.id, villageIds));
  return new Map(rows.map((r) => [r.id, r]));
}

/**
 * Sends one message to the village's webhook and/or the owner's DMs.
 * "retry" = nothing got through and at least one failure is worth retrying.
 */
async function deliver(recipient: Recipient, message: (tag: string) => string): Promise<Outcome> {
  const dmTo = recipient.dmAlerts ? recipient.discordId : null;
  // Stored encrypted; unreadable (secret rotated) counts as no webhook
  const webhook = recipient.webhook ? await openWebhookUrl(recipient.webhook) : null;
  if (recipient.webhook && !webhook) console.warn(`[notify] ${recipient.playerTag}: webhook can't be decrypted`);
  if (!webhook && !dmTo) return "no_destination";

  const content = message(recipient.playerTag);
  const results = await Promise.all([
    ...(webhook ? [sendDiscordMessage(webhook, content)] : []),
    ...(dmTo ? [sendDiscordDm(dmTo, content)] : []),
  ]);
  for (const r of results) {
    if (!r.ok) console.warn(`[notify] ${recipient.playerTag}: ${r.error}`);
  }
  if (results.some((r) => r.ok)) return "sent";
  return results.some((r) => !r.ok && r.retry) ? "retry" : "failed";
}

/**
 * Claims every ACTIVE, un-notified upgrade that finishes within its village's
 * alert lead time (see lib/alerts.ts), then sends one Discord message per
 * village. The claim is a single UPDATE … WHERE notified_at IS NULL, so
 * overlapping runs can never notify the same upgrade.
 */
export async function runNotificationSweep(now = Math.floor(Date.now() / 1000)): Promise<SweepSummary> {
  // Same as alertCutoff(), per village: lead > 0 adds one sweep interval
  const cutoff = sql`${now} + ${villages.alertLeadMinutes} * 60 + case when ${villages.alertLeadMinutes} > 0 then ${SWEEP_INTERVAL_SECONDS} else 0 end`;
  const claimed: Finished[] = await db
    .update(upgrades)
    .set({ notifiedAt: new Date() })
    .from(villages)
    .where(
      and(
        eq(upgrades.villageId, villages.id),
        isNull(upgrades.notifiedAt),
        lte(upgrades.currentFinishTime, cutoff)
      )
    )
    .returning({
      id: upgrades.id,
      villageId: upgrades.villageId,
      entityName: upgrades.entityName,
      isGearUp: upgrades.isGearUp,
      isExtraSlot: upgrades.isExtraSlot,
      targetLevel: upgrades.targetLevel,
      currentFinishTime: upgrades.currentFinishTime,
    });

  const summary: SweepSummary = {
    claimed: claimed.length,
    sent: 0,
    skippedStale: 0,
    skippedNoDestination: 0,
    failed: 0,
    retrying: 0,
  };
  if (claimed.length === 0) return summary;

  const fresh = claimed.filter((u) => u.currentFinishTime >= now - STALE_AFTER_SECONDS);
  summary.skippedStale = claimed.length - fresh.length;
  if (fresh.length === 0) return summary;

  const byVillage = new Map<string, Finished[]>();
  for (const u of fresh) byVillage.set(u.villageId, [...(byVillage.get(u.villageId) ?? []), u]);

  const recipientById = await loadRecipients([...byVillage.keys()]);

  await Promise.all(
    [...byVillage.entries()].map(async ([villageId, items]) => {
      const recipient = recipientById.get(villageId);
      const sorted = [...items]
        .sort((a, b) => a.currentFinishTime - b.currentFinishTime)
        .map((u) => ({ ...u, entityName: upgradeLabel({ ...u, name: u.entityName }) }));
      const outcome = recipient
        ? await deliver(recipient, (tag) => alertMessage(tag, sorted, now, `${appUrl()}/v/${tagToSlug(tag)}`))
        : "no_destination";

      if (outcome === "sent") {
        summary.sent += items.length;
      } else if (outcome === "retry") {
        // Nothing got through: release the claim so the next run tries again
        // (until it goes stale). A partial success isn't retried, to avoid duplicates.
        summary.retrying += items.length;
        await db
          .update(upgrades)
          .set({ notifiedAt: null })
          .where(inArray(upgrades.id, items.map((i) => i.id)));
      } else if (outcome === "no_destination") {
        summary.skippedNoDestination += items.length;
      } else {
        summary.failed += items.length;
      }
    })
  );

  return summary;
}

export interface IdleSweepSummary {
  claimed: number;
  sent: number;
  failed: number;
  retrying: number;
}

/**
 * "Anything sitting idle?" nudge (see IDLE_AFTER_SECONDS in lib/alerts.ts).
 * Claims villages with the nudge on, an alert destination, no nudge since the
 * last sync, and a main-slot upgrade (not the Goblin/extra slot) that finished
 * IDLE_AFTER ago (within the window). One UPDATE … RETURNING, like the alert
 * sweep, so overlapping runs can't send it twice. Uses only our own data.
 */
export async function runIdleReminderSweep(now = Math.floor(Date.now() / 1000)): Promise<IdleSweepSummary> {
  const latest = now - IDLE_AFTER_SECONDS;
  const earliest = latest - IDLE_WINDOW_SECONDS;

  const claimed = await db
    .update(villages)
    .set({ idleRemindedAt: new Date() })
    .where(
      and(
        eq(villages.idleReminders, true),
        isNull(villages.idleRemindedAt),
        or(isNotNull(villages.discordWebhookUrl), eq(villages.dmAlerts, true)),
        exists(
          db
            .select({ one: sql`1` })
            .from(upgrades)
            .where(
              and(
                eq(upgrades.villageId, villages.id),
                not(upgrades.isExtraSlot),
                between(upgrades.currentFinishTime, earliest, latest)
              )
            )
        )
      )
    )
    .returning({ id: villages.id });

  const summary: IdleSweepSummary = { claimed: claimed.length, sent: 0, failed: 0, retrying: 0 };
  if (claimed.length === 0) return summary;

  const ids = claimed.map((c) => c.id);
  const [recipientById, finished] = await Promise.all([
    loadRecipients(ids),
    // Everything done so far (not just the window): the message lists all of it
    db
      .select({
        villageId: upgrades.villageId,
        category: upgrades.category,
        currentFinishTime: upgrades.currentFinishTime,
      })
      .from(upgrades)
      .where(
        and(inArray(upgrades.villageId, ids), not(upgrades.isExtraSlot), lte(upgrades.currentFinishTime, latest))
      ),
  ]);

  await Promise.all(
    ids.map(async (villageId) => {
      const recipient = recipientById.get(villageId);
      const items = finished.filter((f) => f.villageId === villageId);
      const outcome =
        recipient && items.length > 0
          ? await deliver(recipient, (tag) => idleReminderMessage(tag, items, `${appUrl()}/v/${tagToSlug(tag)}`))
          : "failed";

      if (outcome === "sent") {
        summary.sent++;
      } else if (outcome === "retry") {
        summary.retrying++;
        await db.update(villages).set({ idleRemindedAt: null }).where(eq(villages.id, villageId));
      } else {
        // No destination after all (e.g. webhook can't be decrypted) or a hard failure:
        // keep the claim so this sync isn't nudged again
        summary.failed++;
      }
    })
  );

  return summary;
}
