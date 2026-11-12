import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Village ownership is proven once with Supercell's in-game API token
 * (POST /players/{tag}/verifytoken). After that, the browser holds an
 * HMAC-signed cookie listing the tags it has verified.
 *
 * This is a stopgap until real accounts (Discord login) land in Phase 7.
 */
export const OWNER_COOKIE = "cs_owner";
const MAX_TAGS = 10;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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

function encode(tags: string[]): string {
  const payload = Buffer.from(JSON.stringify(tags)).toString("base64url");
  return `${payload}.${sign(payload)}`;
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

/** Tags this browser has proven it owns. Reads request cookies (runtime data). */
export async function getOwnedTags(): Promise<string[]> {
  return decode((await cookies()).get(OWNER_COOKIE)?.value);
}

export async function ownsTag(tag: string): Promise<boolean> {
  return (await getOwnedTags()).includes(tag);
}

/** Adds a tag to the ownership cookie. Only callable from a Route Handler / Server Function. */
export async function rememberOwnedTag(tag: string): Promise<void> {
  const store = await cookies();
  const current = decode(store.get(OWNER_COOKIE)?.value).filter((t) => t !== tag);
  const next = [tag, ...current].slice(0, MAX_TAGS);
  store.set(OWNER_COOKIE, encode(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}
