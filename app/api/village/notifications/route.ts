import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authAccounts, villages, type Village } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import {
  isDiscordWebhookUrl,
  isDmConfigured,
  sendDiscordDm,
  sendDiscordMessage,
  type SendResult,
} from "@/lib/discord";
import { appUrl } from "@/lib/app-url";
import { isAlertLead } from "@/lib/alerts";
import { getVillageAccess } from "@/lib/ownership";
import { normalizeTag, tagToSlug } from "@/lib/tags";

type Body = { tag?: unknown; webhookUrl?: unknown; dm?: unknown; leadMinutes?: unknown };

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

/** Discord account id of an account, if it logged in with Discord. */
async function discordIdFor(accountUserId: string): Promise<string | null> {
  const [row] = await db
    .select({ discordId: authAccounts.accountId })
    .from(authAccounts)
    .where(and(eq(authAccounts.userId, accountUserId), eq(authAccounts.providerId, "discord")))
    .limit(1);
  return row?.discordId ?? null;
}

/** Alerts are personal, so only the village's owner may configure them. */
async function loadOwnedVillage(
  request: NextRequest
): Promise<{ village: Village; tag: string; body: Body } | NextResponse> {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }
  const tag = normalizeTag(typeof body.tag === "string" ? body.tag : null);
  if (!tag) return fail("That doesn't look like a valid player tag.", 400);

  const [village] = await db.select().from(villages).where(eq(villages.playerTag, tag)).limit(1);
  if (!village) return fail(`${tag} hasn't been synced yet.`, 404);
  if (!(await getVillageAccess(village)).isOwner) {
    return fail("Log in with Discord and link this village to your account to set up alerts.", 403);
  }
  return { village, tag, body };
}

/** PUT { tag, webhookUrl } → save a channel webhook (sends a confirmation message first). */
export async function PUT(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  const { village, tag, body } = loaded;

  const webhookUrl = typeof body.webhookUrl === "string" ? body.webhookUrl.trim() : "";
  if (!isDiscordWebhookUrl(webhookUrl)) {
    return fail(
      "That isn't a Discord webhook URL. In Discord: Channel settings → Integrations → Webhooks → Copy Webhook URL.",
      400
    );
  }

  // Prove the webhook works before saving it
  const result = await sendDiscordMessage(
    webhookUrl,
    `✅ ClashSync alerts are on for **${tag}**. You'll get a message here when an upgrade finishes.\n${appUrl()}/v/${tagToSlug(tag)}`
  );
  if (!result.ok) return fail(result.error, 400);

  await db
    .update(villages)
    .set({ discordWebhookUrl: webhookUrl, updatedAt: new Date() })
    .where(eq(villages.id, village.id));
  return NextResponse.json({ success: true });
}

/**
 * PATCH { tag, leadMinutes } → how early to alert (see lib/alerts.ts).
 * PATCH { tag, dm } → turn DM alerts on (sends a confirmation DM first) or off.
 */
export async function PATCH(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  const { village, tag, body } = loaded;

  if (body.leadMinutes !== undefined) {
    if (!isAlertLead(body.leadMinutes)) return fail("Pick one of the offered alert times.", 400);
    await db
      .update(villages)
      .set({ alertLeadMinutes: body.leadMinutes, updatedAt: new Date() })
      .where(eq(villages.id, village.id));
    return NextResponse.json({ success: true });
  }

  const dm = body.dm === true;

  if (dm) {
    if (!isDmConfigured()) return fail("Discord DMs aren't set up on this server yet.", 503);
    const viewer = await getSessionUser();
    // DMs go to the account that owns the village
    if (!viewer || village.ownerId !== viewer.id) {
      return fail("Log in with Discord to get alerts as DMs.", 403);
    }
    const discordId = await discordIdFor(viewer.id);
    if (!discordId) return fail("Your account isn't connected to Discord.", 400);

    const result = await sendDiscordDm(
      discordId,
      `✅ ClashSync DM alerts are on for **${tag}**. I'll message you when an upgrade finishes.\n${appUrl()}/v/${tagToSlug(tag)}`
    );
    if (!result.ok) return fail(result.error, 400);
  }

  await db.update(villages).set({ dmAlerts: dm, updatedAt: new Date() }).where(eq(villages.id, village.id));
  return NextResponse.json({ success: true });
}

/** POST { tag } → send a test message to every alert destination that's on. */
export async function POST(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  const { village, tag } = loaded;

  const message = `🧪 Test alert from ClashSync for **${tag}**. Alerts are working!`;
  const sends: Promise<SendResult>[] = [];
  if (village.discordWebhookUrl) sends.push(sendDiscordMessage(village.discordWebhookUrl, message));
  if (village.dmAlerts && village.ownerId) {
    const discordId = await discordIdFor(village.ownerId);
    if (discordId) sends.push(sendDiscordDm(discordId, message));
  }
  if (sends.length === 0) return fail("No Discord alerts are turned on yet.", 400);

  const failed = (await Promise.all(sends)).find((r) => !r.ok);
  return failed && !failed.ok ? fail(failed.error, 502) : NextResponse.json({ success: true });
}

/** DELETE { tag } → remove the channel webhook. */
export async function DELETE(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  await db
    .update(villages)
    .set({ discordWebhookUrl: null, updatedAt: new Date() })
    .where(eq(villages.id, loaded.village.id));
  return NextResponse.json({ success: true });
}
