import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser, type SessionUser } from "@/lib/auth";

/**
 * Who may change a village (sync, potions, alerts):
 *
 * - Claimed (`ownerId` set): only that Discord account, on any device.
 * - Unclaimed but verified the old way (API token before accounts existed):
 *   only browsers holding the legacy `cs_owner` cookie. Logging in from such a
 *   browser claims the village (app/api/account/after-login).
 * - Unclaimed: anyone. A logged-in sync claims it for that account.
 *
 * The in-game API token always wins: it moves a village to the account that
 * proves it (app/api/village/claim).
 */

export interface VillageOwnership {
  playerTag: string | null;
  ownerId: string | null;
  verifiedAt: Date | null;
}

export type AccessReason = "owned_by_other" | "legacy_protected";

export interface VillageAccess {
  /** Logged-in person, if any. */
  viewer: SessionUser | null;
  /** May sync, apply potions, … */
  canEdit: boolean;
  /** Owns it: account owner, or legacy cookie owner of an unclaimed verified village. */
  isOwner: boolean;
  /** A write by this viewer should set `ownerId` to them. */
  shouldClaim: boolean;
  reason?: AccessReason;
}

export async function getVillageAccess(village: VillageOwnership): Promise<VillageAccess> {
  const viewer = await getSessionUser();

  if (village.ownerId) {
    const isOwner = viewer?.id === village.ownerId;
    return {
      viewer,
      canEdit: isOwner,
      isOwner,
      shouldClaim: false,
      reason: isOwner ? undefined : "owned_by_other",
    };
  }

  if (village.verifiedAt) {
    const legacyOwner =
      village.playerTag !== null && (await getLegacyOwnedTags()).includes(village.playerTag);
    return {
      viewer,
      canEdit: legacyOwner,
      isOwner: legacyOwner,
      shouldClaim: legacyOwner && viewer !== null,
      reason: legacyOwner ? undefined : "legacy_protected",
    };
  }

  return { viewer, canEdit: true, isOwner: false, shouldClaim: viewer !== null };
}

export function accessDeniedMessage(tag: string, reason: AccessReason | undefined): string {
  return reason === "owned_by_other"
    ? `${tag} is linked to another ClashSync account. If it's your village, open its page and take it over with your in-game API token.`
    : `${tag} is protected by its owner. Log in with Discord on the device you verified it on, or take it over with your in-game API token on its page.`;
}

/* ---------------------------------------------------------------------------
 * Legacy `cs_owner` cookie (pre-accounts). Read-only now: it's only used to
 * recognise old owners and to migrate their villages on first login.
 * ------------------------------------------------------------------------- */

export const OWNER_COOKIE = "cs_owner";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (at least 16 characters).");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function decode(value: string | undefined): string[] {
  if (!value) return [];
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return [];
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return [];
  }
  try {
    const tags = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/** Tags this browser proved with an API token before accounts existed. */
export async function getLegacyOwnedTags(): Promise<string[]> {
  return decode((await cookies()).get(OWNER_COOKIE)?.value);
}

/** Removes the legacy cookie. Only callable from a Route Handler / Server Function. */
export async function clearLegacyOwnerCookie(): Promise<void> {
  (await cookies()).delete(OWNER_COOKIE);
}
