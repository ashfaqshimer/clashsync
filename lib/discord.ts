/**
 * Discord webhook delivery. The server POSTs to user-supplied URLs, so only
 * genuine Discord webhook URLs are accepted (prevents SSRF to other hosts).
 */
const WEBHOOK_URL =
  /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d{5,25}\/[\w-]{20,100}$/;

export function isDiscordWebhookUrl(url: string): boolean {
  return WEBHOOK_URL.test(url.trim());
}

export type SendResult =
  | { ok: true }
  /** `retry`: transient (rate limit / Discord outage), worth trying again later. */
  | { ok: false; retry: boolean; status: number | null; error: string };

const MAX_CONTENT = 2000;

export async function sendDiscordMessage(webhookUrl: string, content: string): Promise<SendResult> {
  if (!isDiscordWebhookUrl(webhookUrl)) {
    return { ok: false, retry: false, status: null, error: "Not a Discord webhook URL." };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "ClashSync",
        content: content.slice(0, MAX_CONTENT),
        allowed_mentions: { parse: [] }, // never ping @everyone etc.
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) return { ok: true };
    return {
      ok: false,
      retry: res.status === 429 || res.status >= 500,
      status: res.status,
      error:
        res.status === 404 || res.status === 401
          ? "Discord says this webhook no longer exists. Create a new one and save it again."
          : `Discord returned HTTP ${res.status}.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, retry: true, status: null, error: `Couldn't reach Discord: ${message}` };
  }
}

/* ---------------------------------------------------------------------------
 * Bot API (DMs + adding users to the ClashSync server). A bot can only DM
 * someone it shares a server with, so login adds the user to that server.
 * ------------------------------------------------------------------------- */

const API = "https://discord.com/api/v10";

function botHeaders(): Record<string, string> | null {
  const token = process.env.DISCORD_BOT_TOKEN;
  return token ? { Authorization: `Bot ${token}`, "Content-Type": "application/json" } : null;
}

export function isDmConfigured(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID);
}

/**
 * Adds a user to the ClashSync server using their OAuth access token
 * (`guilds.join` scope). Already being a member counts as success.
 */
export async function addUserToGuild(discordUserId: string, accessToken: string): Promise<SendResult> {
  const headers = botHeaders();
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!headers || !guildId) {
    return { ok: false, retry: false, status: null, error: "Discord bot isn't configured." };
  }
  try {
    const res = await fetch(`${API}/guilds/${guildId}/members/${discordUserId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ access_token: accessToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    // 201 = added, 204 = already a member
    if (res.ok) return { ok: true };
    return {
      ok: false,
      retry: res.status === 429 || res.status >= 500,
      status: res.status,
      error: `Discord returned HTTP ${res.status} when joining the server.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, retry: true, status: null, error: `Couldn't reach Discord: ${message}` };
  }
}

/** Sends a DM from the ClashSync bot. */
export async function sendDiscordDm(discordUserId: string, content: string): Promise<SendResult> {
  const headers = botHeaders();
  if (!headers) {
    return { ok: false, retry: false, status: null, error: "Discord DMs aren't set up on this server." };
  }
  try {
    const channelRes = await fetch(`${API}/users/@me/channels`, {
      method: "POST",
      headers,
      body: JSON.stringify({ recipient_id: discordUserId }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!channelRes.ok) return dmFailure(channelRes.status);
    const channel = (await channelRes.json()) as { id?: string };
    if (!channel.id) return dmFailure(null);

    const res = await fetch(`${API}/channels/${channel.id}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        content: content.slice(0, MAX_CONTENT),
        allowed_mentions: { parse: [] },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? { ok: true } : dmFailure(res.status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, retry: true, status: null, error: `Couldn't reach Discord: ${message}` };
  }
}

function dmFailure(status: number | null): SendResult {
  return {
    ok: false,
    retry: status === null || status === 429 || status >= 500,
    status,
    error:
      status === 403
        ? "Discord won't let the ClashSync bot DM you. Make sure you're still in the ClashSync server and allow DMs from its members (Server → Privacy Settings)."
        : `Discord returned HTTP ${status ?? "an unexpected response"}.`,
  };
}
