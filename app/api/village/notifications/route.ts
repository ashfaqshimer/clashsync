import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authAccounts, users, type User } from "@/lib/db/schema";
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

/** Discord user id of an account, if it logged in with Discord. */
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
): Promise<{ user: User; tag: string; body: Body } | NextResponse> {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }
  const tag = normalizeTag(typeof body.tag === "string" ? body.tag : null);
  if (!tag) return fail("That doesn't look like a valid player tag.", 400);

  const [user] = await db.select().from(users).where(eq(users.playerTag, tag)).limit(1);
  if (!user) return fail(`${tag} hasn't been synced yet.`, 404);
  if (!(await getVillageAccess(user)).isOwner) {
    return fail("Log in with Discord and link this village to your account to set up alerts.", 403);
  }
  return { user, tag, body };
}

/** PUT { tag, webhookUrl } → save a channel webhook (sends a confirmation message first). */
export async function PUT(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  const { user, tag, body } = loaded;

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
    .update(users)
    .set({ discordWebhookUrl: webhookUrl, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return NextResponse.json({ success: true });
}

/**
 * PATCH { tag, leadMinutes } → how early to alert (see lib/alerts.ts).
 * PATCH { tag, dm } → turn DM alerts on (sends a confirmation DM first) or off.
 */
export async function PATCH(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  const { user, tag, body } = loaded;

  if (body.leadMinutes !== undefined) {
    if (!isAlertLead(body.leadMinutes)) return fail("Pick one of the offered alert times.", 400);
    await db
      .update(users)
      .set({ alertLeadMinutes: body.leadMinutes, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    return NextResponse.json({ success: true });
  }

  const dm = body.dm === true;

  if (dm) {
    if (!isDmConfigured()) return fail("Discord DMs aren't set up on this server yet.", 503);
    const viewer = await getSessionUser();
    // DMs go to the owning account, so a legacy (cookie-only) owner must log in first
    if (!viewer || user.ownerId !== viewer.id) {
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

  await db.update(users).set({ dmAlerts: dm, updatedAt: new Date() }).where(eq(users.id, user.id));
  return NextResponse.json({ success: true });
}

/** POST { tag } → send a test message to every alert destination that's on. */
export async function POST(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  const { user, tag } = loaded;

  const message = `🧪 Test alert from ClashSync for **${tag}**. Alerts are working!`;
  const sends: Promise<SendResult>[] = [];
  if (user.discordWebhookUrl) sends.push(sendDiscordMessage(user.discordWebhookUrl, message));
  if (user.dmAlerts && user.ownerId) {
    const discordId = await discordIdFor(user.ownerId);
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
    .update(users)
    .set({ discordWebhookUrl: null, updatedAt: new Date() })
    .where(eq(users.id, loaded.user.id));
  return NextResponse.json({ success: true });
}
