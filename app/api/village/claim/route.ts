import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPlayerToken } from "@/lib/clash-api";
import { rememberOwnedTag } from "@/lib/ownership";
import { normalizeTag } from "@/lib/tags";

/**
 * POST { tag, token } → proves ownership of a village using the in-game API
 * token, marks the village as verified, and remembers it in this browser.
 */
export async function POST(request: NextRequest) {
  let body: { tag?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const tag = normalizeTag(typeof body.tag === "string" ? body.tag : null);
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!tag) {
    return NextResponse.json(
      { success: false, error: "That doesn't look like a valid player tag." },
      { status: 400 }
    );
  }
  if (!token || token.length > 64) {
    return NextResponse.json(
      { success: false, error: "Paste the API token from your in-game settings." },
      { status: 400 }
    );
  }

  const result = await verifyPlayerToken(tag, token);
  if (!result.ok) {
    const status = result.reason === "invalid" ? 403 : result.reason === "key_missing" ? 503 : 502;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.playerTag, tag))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(users)
        .set({ verifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, existing[0].id));
    } else {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        playerTag: tag,
        verifiedAt: new Date(),
      });
    }

    await rememberOwnedTag(tag);
    return NextResponse.json({ success: true, playerTag: tag });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Couldn't save your verification: ${message}` },
      { status: 500 }
    );
  }
}
