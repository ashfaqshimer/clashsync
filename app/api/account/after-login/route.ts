import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authAccounts } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { addUserToGuild, isDmConfigured } from "@/lib/discord";

/**
 * Discord login lands here (callbackURL in lib/auth-client.ts) before going
 * on to `next`. The bot adds the user to the ClashSync server so it can DM
 * them (bots can only DM people they share a server with). This step can
 * never fail the login.
 */
export async function GET(request: NextRequest) {
  const nextParam = request.nextUrl.searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const destination = new URL(next, request.nextUrl.origin);

  const viewer = await getSessionUser();
  if (!viewer || !isDmConfigured()) return NextResponse.redirect(destination);

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

  return NextResponse.redirect(destination);
}
