import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { villages } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { verifyPlayerToken } from "@/lib/clash-api";
import { normalizeTag } from "@/lib/tags";

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * POST { tag, token } → take over a village with the in-game API token.
 *
 * The token is real proof of ownership, so it beats any earlier claim: the
 * village moves to the logged-in account. Alerts set up by the previous owner
 * are switched off so they stop receiving this village's messages.
 */
export async function POST(request: NextRequest) {
  let body: { tag?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const viewer = await getSessionUser();
  if (!viewer) return fail("Log in with Discord first, then paste your API token.", 401);

  const tag = normalizeTag(typeof body.tag === "string" ? body.tag : null);
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!tag) return fail("That doesn't look like a valid player tag.", 400);
  if (!token || token.length > 64) {
    return fail("Paste the API token from your in-game settings.", 400);
  }

  const result = await verifyPlayerToken(tag, token);
  if (!result.ok) {
    const status = result.reason === "invalid" ? 403 : result.reason === "key_missing" ? 503 : 502;
    return fail(result.error, status);
  }

  try {
    const [existing] = await db
      .select({ id: villages.id, ownerId: villages.ownerId })
      .from(villages)
      .where(eq(villages.playerTag, tag))
      .limit(1);

    const now = new Date();
    if (existing) {
      // Alerts follow the person: a new owner starts with them off
      const sameOwner = existing.ownerId === viewer.id;
      await db
        .update(villages)
        .set({
          ownerId: viewer.id,
          verifiedAt: now,
          updatedAt: now,
          ...(sameOwner ? {} : { discordWebhookUrl: null, dmAlerts: false }),
        })
        .where(eq(villages.id, existing.id));
    } else {
      await db.insert(villages).values({
        id: crypto.randomUUID(),
        playerTag: tag,
        ownerId: viewer.id,
        verifiedAt: now,
      });
    }

    return NextResponse.json({ success: true, playerTag: tag });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return fail(`Couldn't save your verification: ${message}`, 500);
  }
}
