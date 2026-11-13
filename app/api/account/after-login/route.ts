import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { authAccounts, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { addUserToGuild, isDmConfigured } from "@/lib/discord";
import { clearLegacyOwnerCookie, getLegacyOwnedTags } from "@/lib/ownership";

/**
 * Discord login lands here (callbackURL in lib/auth-client.ts) before going
 * on to `next`:
 *  1. Villages this browser verified the old way (cs_owner cookie) and that
 *     nobody has claimed yet are linked to the account; the cookie is dropped.
 *  2. The bot adds the user to the ClashSync server so it can DM them.
 * Neither step can fail the login.
 */
export async function GET(request: NextRequest) {
  const nextParam = request.nextUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const destination = new URL(next, request.nextUrl.origin);

  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.redirect(destination);

  try {
    const legacyTags = await getLegacyOwnedTags();
    if (legacyTags.length > 0) {
      await db
        .update(users)
        .set({ ownerId: viewer.id, updatedAt: new Date() })
        .where(
          and(
            inArray(users.playerTag, legacyTags),
            isNull(users.ownerId),
            isNotNull(users.verifiedAt)
          )
        );
      await clearLegacyOwnerCookie();
    }
  } catch (err) {
    console.warn("[after-login] linking legacy villages failed:", err);
  }

  if (isDmConfigured()) {
    try {
      const [discord] = await db
        .select({ discordId: authAccounts.accountId, accessToken: authAccounts.accessToken })
        .from(authAccounts)
        .where(and(eq(authAccounts.userId, viewer.id), eq(authAccounts.providerId, "discord")))
        .limit(1);
      if (discord?.accessToken) {
        const joined = await addUserToGuild(discord.discordId, discord.accessToken);
        if (!joined.ok) console.warn(`[after-login] guild join: ${joined.error}`);
      }
    } catch (err) {
      console.warn("[after-login] guild join failed:", err);
    }
  }

  return NextResponse.redirect(destination);
}
