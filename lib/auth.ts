import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { authAccounts, authSessions, authUsers, authVerifications } from "@/lib/db/schema";
import { appUrl } from "@/lib/app-url";

/**
 * Discord login (self-hosted Better Auth, sessions in our Neon DB).
 *
 * `guilds.join` lets the bot add the user to the ClashSync server after login
 * (see app/api/account/after-login), which is what makes DM alerts possible.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || appUrl(),
  // BETTER_AUTH_SECRET preferred; AUTH_SECRET kept as a fallback
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  // neon-http has no interactive transactions; the adapter runs statements in sequence
  database: drizzleAdapter(db, {
    provider: "pg",
    transaction: false,
    schema: {
      authUser: authUsers,
      authSession: authSessions,
      authAccount: authAccounts,
      authVerification: authVerifications,
    },
  }),
  user: { modelName: "authUser" },
  session: {
    modelName: "authSession",
    // Skip the DB lookup on most requests
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  account: { modelName: "authAccount" },
  verification: { modelName: "authVerification" },
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      scope: ["guilds.join"],
      // Discord accounts without an email (phone-only) still need a unique one here
      mapProfileToUser: (profile) =>
        profile.email ? {} : { email: `${profile.id}@users.discord.invalid`, emailVerified: false },
    },
  },
  plugins: [nextCookies()], // must stay last
});

export interface SessionUser {
  id: string;
  name: string;
  image: string | null;
}

/** The logged-in person for this request, or null. Reads request headers (runtime data). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, image } = session.user;
  return { id, name, image: image ?? null };
}
