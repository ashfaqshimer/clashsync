import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";

/**
 * Encryption at rest for secrets we store, such as Discord webhook URLs (anyone
 * holding one can post to that channel). Same scheme Better Auth uses for OAuth
 * tokens (XChaCha20-Poly1305), keyed from BETTER_AUTH_SECRET with a per-use
 * suffix. Server only.
 *
 * Rotating BETTER_AUTH_SECRET makes stored webhooks unreadable: owners have to
 * save them again (openSecret returns null instead of throwing).
 */

function key(purpose: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return `${secret}:${purpose}`;
}

const WEBHOOK = "discord-webhook";

export function sealWebhookUrl(url: string): Promise<string> {
  return symmetricEncrypt({ key: key(WEBHOOK), data: url });
}

/** Plain URL, or null if it can't be decrypted (e.g. the secret changed). */
export async function openWebhookUrl(stored: string): Promise<string | null> {
  try {
    return await symmetricDecrypt({ key: key(WEBHOOK), data: stored });
  } catch {
    return null;
  }
}
