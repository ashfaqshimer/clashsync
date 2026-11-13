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
