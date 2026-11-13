import { getSessionUser, type SessionUser } from "@/lib/auth";

/**
 * Who may change a village (sync, potions, alerts):
 *
 * - Claimed (`ownerId` set): only that Discord account, on any device.
 * - Unclaimed: anyone. A logged-in sync claims it for that account.
 *
 * The in-game API token always wins: it moves a village to the account that
 * proves it (app/api/village/claim).
 */

export interface VillageOwnership {
  playerTag: string | null;
  ownerId: string | null;
}

export interface VillageAccess {
  /** Logged-in person, if any. */
  viewer: SessionUser | null;
  /** May sync, apply potions, … */
  canEdit: boolean;
  /** The viewer's account owns it. */
  isOwner: boolean;
  /** A write by this viewer should set `ownerId` to them. */
  shouldClaim: boolean;
}

export async function getVillageAccess(village: VillageOwnership): Promise<VillageAccess> {
  const viewer = await getSessionUser();
  if (village.ownerId) {
    const isOwner = viewer?.id === village.ownerId;
    return { viewer, canEdit: isOwner, isOwner, shouldClaim: false };
  }
  return { viewer, canEdit: true, isOwner: false, shouldClaim: viewer !== null };
}

export function accessDeniedMessage(tag: string): string {
  return `${tag} is linked to another ClashSync account. If it's your village, open its page and take it over with your in-game API token.`;
}
