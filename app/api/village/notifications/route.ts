import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { isDiscordWebhookUrl, sendDiscordMessage } from "@/lib/discord";
import { appUrl } from "@/lib/notify";
import { ownsTag } from "@/lib/ownership";
import { normalizeTag, tagToSlug } from "@/lib/tags";

type Body = { tag?: unknown; webhookUrl?: unknown };

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Discord alerts are personal, so unlike sync/potions they require a
 * *verified* owner — an unverified village can't have alerts configured.
 */
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
  if (!user.verifiedAt || !(await ownsTag(tag))) {
    return fail("Verify you own this village before setting up Discord alerts.", 403);
  }
  return { user, tag, body };
}

/** PUT { tag, webhookUrl } → save the Discord webhook (sends a confirmation message first). */
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

/** POST { tag } → send a test message to the saved webhook. */
export async function POST(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  const { user, tag } = loaded;

  if (!user.discordWebhookUrl) return fail("No Discord webhook saved yet.", 400);
  const result = await sendDiscordMessage(
    user.discordWebhookUrl,
    `🧪 Test alert from ClashSync for **${tag}**. Alerts are working!`
  );
  return result.ok ? NextResponse.json({ success: true }) : fail(result.error, 502);
}

/** DELETE { tag } → turn alerts off. */
export async function DELETE(request: NextRequest) {
  const loaded = await loadOwnedVillage(request);
  if (loaded instanceof NextResponse) return loaded;
  await db
    .update(users)
    .set({ discordWebhookUrl: null, updatedAt: new Date() })
    .where(eq(users.id, loaded.user.id));
  return NextResponse.json({ success: true });
}
