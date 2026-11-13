import { createAuthClient } from "better-auth/react";

/** Browser-side auth helpers (same origin, so no baseURL needed). */
export const authClient = createAuthClient();

/** Starts Discord login, then lands back on `next` via the after-login step. */
export function signInWithDiscord(next = "/") {
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return authClient.signIn.social({
    provider: "discord",
    callbackURL: `/api/account/after-login?next=${encodeURIComponent(safeNext)}`,
  });
}
