import { cacheLife } from "next/cache";
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

/** Name, Town Hall and clan from the Supercell API. Renders nothing if the API is unavailable. */
export async function PlayerProfile({ tag }: { tag: string }) {
  const profile = await loadProfile(tag).catch(() => null);
  return profile ? <PlayerProfileLine profile={profile} /> : null;
}
