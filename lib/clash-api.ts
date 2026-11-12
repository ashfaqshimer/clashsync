export interface ClashPlayerProfile {
  tag: string;
  name: string;
  townHallLevel: number;
  townHallWeaponLevel?: number;
  builderHallLevel?: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  clan?: {
    tag: string;
    name: string;
    clanLevel: number;
    badgeUrls?: {
      small?: string;
      large?: string;
      medium?: string;
    };
  };
  heroes?: Array<{
    name: string;
    level: number;
    maxLevel: number;
    village: string;
  }>;
  spells?: Array<{
    name: string;
    level: number;
    maxLevel: number;
    village: string;
  }>;
  troops?: Array<{
    name: string;
    level: number;
    maxLevel: number;
    village: string;
  }>;
}

export interface PlayerLookupResult {
  success: boolean;
  player?: ClashPlayerProfile;
  error?: string;
  isKeyMissing?: boolean;
}

export type VerifyTokenResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "key_missing" | "error"; error: string };

/**
 * Checks the one-time API token shown in-game (Settings → More Settings →
 * API Token) against the player's tag. A valid token proves the caller has
 * access to that account. `tag` must already be normalized ("#XXXX").
 */
export async function verifyPlayerToken(
  tag: string,
  token: string
): Promise<VerifyTokenResult> {
  const apiKey = process.env.CLASH_API_KEY || process.env.COC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "key_missing",
      error: "Ownership checks are not available yet. Please try again later.",
    };
  }

  try {
    const res = await fetch(
      `https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}/verifytoken`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token.trim() }),
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      return { ok: false, reason: "invalid", error: `Player ${tag} was not found.` };
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: "error",
        error: `Couldn't reach Clash of Clans right now (HTTP ${res.status}).`,
      };
    }

    const data: { status?: string } = await res.json();
    return data.status === "ok"
      ? { ok: true }
      : {
          ok: false,
          reason: "invalid",
          error: "That token didn't match. Tokens expire quickly, so copy a fresh one.",
        };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, reason: "error", error: `Couldn't reach Clash of Clans: ${message}` };
  }
}

/**
 * Fetches public player information from the official Clash of Clans Developer API.
 */
export async function fetchPlayerProfile(rawTag: string): Promise<PlayerLookupResult> {
  const apiKey = process.env.CLASH_API_KEY || process.env.COC_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      isKeyMissing: true,
      error:
        "Official Supercell API key is not configured in .env.local (CLASH_API_KEY).",
    };
  }

  // Ensure leading '#' is present and format tag for URL encoding
  const formattedTag = rawTag.trim().startsWith("#")
    ? rawTag.trim()
    : `#${rawTag.trim()}`;
  const encodedTag = encodeURIComponent(formattedTag);

  try {
    const res = await fetch(
      `https://api.clashofclans.com/v1/players/${encodedTag}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      return {
        success: false,
        error: `Player tag "${formattedTag}" was not found. Please verify the tag.`,
      };
    }

    if (res.status === 403) {
      return {
        success: false,
        error:
          "Supercell API key rejected (403 Forbidden). Ensure your IP address is whitelisted on developer.clashofclans.com.",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: `Supercell API error: HTTP ${res.status} ${res.statusText}`,
      };
    }

    const data: ClashPlayerProfile = await res.json();
    return {
      success: true,
      player: data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      success: false,
      error: `Failed to connect to Supercell API: ${message}`,
    };
  }
}

