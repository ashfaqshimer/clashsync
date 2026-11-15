import { cacheLife } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { villages } from "@/lib/db/schema";
import { fetchPlayerProfile } from "@/lib/clash-api";
import { PlayerProfileLine, type PlayerSummary } from "./player-profile-line";

/** Public profile, cached for an hour. Failures throw so they're never cached. */
async function loadProfile(tag: string): Promise<PlayerSummary> {
  "use cache";
  cacheLife("hours");

  const result = await fetchPlayerProfile(tag);
  if (!result.success || !result.player) throw new Error(result.error ?? "Profile unavailable");
  const p = result.player;
  return {
    name: p.name,
    townHallLevel: p.townHallLevel,
    trophies: p.trophies,
    clanName: p.clan?.name ?? null,
    clanBadge: p.clan?.badgeUrls?.small ?? null,
  };
}

/**
 * Town Hall, clan and trophies from the Supercell API. Renders nothing if the API
 * is unavailable. Also keeps the stored name / Town Hall (used by "My villages"
 * and the page title) up to date when they change in-game.
 */
export async function PlayerProfile({
  tag,
  stored,
}: {
  tag: string;
  /** What `villages` has now; the name shows in the heading when set. */
  stored: { playerName: string | null; townHallLevel: number | null };
}) {
  const profile = await loadProfile(tag).catch(() => null);
  if (!profile) return null;

  if (profile.name !== stored.playerName || profile.townHallLevel !== stored.townHallLevel) {
    after(() =>
      db
        .update(villages)
        .set({ playerName: profile.name, townHallLevel: profile.townHallLevel })
        .where(eq(villages.playerTag, tag))
        .catch(() => {})
    );
  }

  // The heading already shows the stored name; only repeat it when the heading is the tag
  return <PlayerProfileLine profile={profile} showName={stored.playerName === null} />;
}
