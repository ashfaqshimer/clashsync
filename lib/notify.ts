import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authAccounts, upgrades, villages } from "@/lib/db/schema";
import { appUrl } from "@/lib/app-url";
import { alertMessage, SWEEP_INTERVAL_SECONDS } from "@/lib/alerts";
import { sendDiscordDm, sendDiscordMessage } from "@/lib/discord";
import { tagToSlug } from "@/lib/tags";

/** Finished longer ago than this (cron gap, old export re-synced) → don't announce. */
const STALE_AFTER_SECONDS = 30 * 60;

interface Finished {
  id: string;
  villageId: string;
  entityName: string;
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
        eq(upgrades.status, "ACTIVE"),
        isNull(upgrades.notifiedAt),
        lte(upgrades.currentFinishTime, cutoff)
      )
    )
    .returning({
      id: upgrades.id,
      villageId: upgrades.villageId,
      entityName: upgrades.entityName,
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

  // Destinations: the channel webhook and/or a DM to the owner's Discord account
  const recipients = await db
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
    .where(inArray(villages.id, [...byVillage.keys()]));
  const recipientById = new Map(recipients.map((r) => [r.id, r]));

  await Promise.all(
    [...byVillage.entries()].map(async ([villageId, items]) => {
      const recipient = recipientById.get(villageId);
      const dmTo = recipient?.dmAlerts ? recipient.discordId : null;
      if (!recipient?.playerTag || (!recipient.webhook && !dmTo)) {
        summary.skippedNoDestination += items.length;
        return;
      }

      const sorted = [...items].sort((a, b) => a.currentFinishTime - b.currentFinishTime);
      const content = alertMessage(
        recipient.playerTag,
        sorted,
        now,
        `${appUrl()}/v/${tagToSlug(recipient.playerTag)}`
      );
      const results = await Promise.all([
        ...(recipient.webhook ? [sendDiscordMessage(recipient.webhook, content)] : []),
        ...(dmTo ? [sendDiscordDm(dmTo, content)] : []),
      ]);

      for (const r of results) {
        if (!r.ok) console.warn(`[notify] ${recipient.playerTag}: ${r.error}`);
      }
      if (results.some((r) => r.ok)) {
        summary.sent += items.length;
      } else if (results.some((r) => !r.ok && r.retry)) {
        // Nothing got through: release the claim so the next run tries again
        // (until it goes stale). A partial success isn't retried, to avoid duplicates.
        summary.retrying += items.length;
        await db
          .update(upgrades)
          .set({ notifiedAt: null })
          .where(inArray(upgrades.id, items.map((i) => i.id)));
      } else {
        summary.failed += items.length;
      }
    })
  );

  return summary;
}
