import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "test-secret-at-least-16-chars";
process.env.AUTH_SECRET = SECRET;

let viewer: { id: string; name: string; image: null } | null = null;
let cookieValue: string | undefined;

vi.mock("@/lib/auth", () => ({ getSessionUser: async () => viewer }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieValue ? { value: cookieValue } : undefined) }),
}));

const { getVillageAccess } = await import("./ownership");

/** Builds a legacy cs_owner cookie the same way the old claim route did. */
function legacyCookie(tags: string[]): string {
  const payload = Buffer.from(JSON.stringify(tags)).toString("base64url");
  return `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
}

const TAG = "#PY";
const alice = { id: "alice", name: "Alice", image: null };

beforeEach(() => {
  viewer = null;
  cookieValue = undefined;
});

describe("getVillageAccess", () => {
  it("lets anyone edit an unclaimed village, and claims it for a logged-in viewer", async () => {
    const village = { playerTag: TAG, ownerId: null, verifiedAt: null };
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, isOwner: false, shouldClaim: false });

    viewer = alice;
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, shouldClaim: true });
  });

  it("only lets the owning account edit a claimed village", async () => {
    const village = { playerTag: TAG, ownerId: "alice", verifiedAt: null };
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: false, reason: "owned_by_other" });

    viewer = { id: "mallory", name: "M", image: null };
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: false, reason: "owned_by_other" });

    viewer = alice;
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, isOwner: true, shouldClaim: false });
  });

  it("ignores a legacy cookie once the village is claimed", async () => {
    cookieValue = legacyCookie([TAG]);
    const village = { playerTag: TAG, ownerId: "alice", verifiedAt: new Date() };
    expect((await getVillageAccess(village)).canEdit).toBe(false);
  });

  it("protects a legacy-verified village unless this browser holds the cookie", async () => {
    const village = { playerTag: TAG, ownerId: null, verifiedAt: new Date() };
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: false, reason: "legacy_protected" });

    cookieValue = legacyCookie([TAG]);
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, isOwner: true, shouldClaim: false });

    viewer = alice;
    expect(await getVillageAccess(village)).toMatchObject({ canEdit: true, shouldClaim: true });
  });

  it("rejects a tampered legacy cookie", async () => {
    const [payload] = legacyCookie(["#OTHER"]).split(".");
    const forged = Buffer.from(JSON.stringify([TAG])).toString("base64url");
    cookieValue = `${forged}.${legacyCookie(["#OTHER"]).split(".")[1]}`;
    expect(payload).not.toBe(forged);
    const village = { playerTag: TAG, ownerId: null, verifiedAt: new Date() };
    expect((await getVillageAccess(village)).canEdit).toBe(false);
  });
});
