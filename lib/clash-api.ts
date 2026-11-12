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

/**
 * Supercell API keys are locked to fixed IPs, but neither Vercel nor home
 * connections have one. All calls go through RoyaleAPI's IP-stable proxy,
 * which forwards to api.clashofclans.com. CLASH_API_KEY must whitelist the
 * proxy's IP (see docs.royaleapi.com), not our own.
 */
const API_BASE = "https://cocproxy.royaleapi.dev/v1";

/**
 * Local-dev mock: no key or network needed. Never active in production
 * builds, since mock verification would let anyone claim any village.
 */
const MOCK =
  process.env.CLASH_API_MOCK === "1" && process.env.NODE_ENV !== "production";

/** In mock mode, this token fails verification so the error path can be tested. */
const MOCK_INVALID_TOKEN = "invalid";

function apiKey(): string | undefined {
  return process.env.CLASH_API_KEY || process.env.COC_API_KEY;
}

function mockProfile(tag: string): ClashPlayerProfile {
  return {
    tag,
    name: "Mock Chief",
    townHallLevel: 16,
    builderHallLevel: 10,
    expLevel: 220,
    trophies: 5100,
    bestTrophies: 5600,
    warStars: 1400,
    clan: { tag: "#2PP", name: "Mock Clan", clanLevel: 20 },
    heroes: [
      { name: "Barbarian King", level: 77, maxLevel: 95, village: "home" },
      { name: "Archer Queen", level: 86, maxLevel: 95, village: "home" },
    ],
  };
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
  if (MOCK) {
    return token.trim() === MOCK_INVALID_TOKEN
      ? {
          ok: false,
          reason: "invalid",
          error: "That token didn't match. Tokens expire quickly, so copy a fresh one.",
        }
      : { ok: true };
  }

  const key = apiKey();
  if (!key) {
    return {
      ok: false,
      reason: "key_missing",
      error: "Ownership checks are not available yet. Please try again later.",
    };
  }

  try {
    const res = await fetch(
      `${API_BASE}/players/${encodeURIComponent(tag)}/verifytoken`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
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
  // Ensure leading '#' is present and format tag for URL encoding
  const formattedTag = rawTag.trim().startsWith("#")
    ? rawTag.trim()
    : `#${rawTag.trim()}`;
  const encodedTag = encodeURIComponent(formattedTag);

  if (MOCK) {
    return { success: true, player: mockProfile(formattedTag.toUpperCase()) };
  }

  const key = apiKey();
  if (!key) {
    return {
      success: false,
      isKeyMissing: true,
      error:
        "Official Supercell API key is not configured in .env.local (CLASH_API_KEY).",
    };
  }

  try {
    const res = await fetch(
      `${API_BASE}/players/${encodedTag}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
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
          "Supercell API key rejected (403 Forbidden). Ensure the RoyaleAPI proxy IP is whitelisted on your key at developer.clashofclans.com.",
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

