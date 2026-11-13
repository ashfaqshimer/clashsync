import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

vi.mock("@/lib/db", async () => (await import("./test-db")).dbModule());

let viewer: { id: string; name: string; image: null } | null = null;
vi.mock("@/lib/auth", () => ({ getSessionUser: async () => viewer }));

let tokenValid = true;
vi.mock("@/lib/clash-api", () => ({
  verifyPlayerToken: async () =>
    tokenValid ? { ok: true } : { ok: false, reason: "invalid", error: "That API token isn't valid." },
}));

const { testDb, resetTestDb, createAccount, villages, upgrades } = await import("./test-db");
const { POST: sync } = await import("@/app/api/village/sync/route");
const { POST: claim } = await import("@/app/api/village/claim/route");

const TAG = "#PYL";
const as = (id: string | null) => {
  viewer = id ? { id, name: id, image: null } : null;
};

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function exportJson(timestamp: number, extra: object = {}) {
  return JSON.stringify({
    tag: TAG,
    timestamp,
    buildings: [{ data: 1000008, lvl: 20, timer: 3600 }],
    units: [{ data: 4000000, lvl: 5, timer: 86400 }],
    ...extra,
  });
}

const now = () => Math.floor(Date.now() / 1000);
const village = async () => (await testDb.select().from(villages).where(eq(villages.playerTag, TAG)))[0];
const activeUpgrades = async () =>
  (await testDb.select().from(upgrades).where(eq(upgrades.status, "ACTIVE"))).sort((a, b) => a.dataId - b.dataId);

beforeEach(async () => {
  await resetTestDb();
  as(null);
  tokenValid = true;
  await createAccount("alice");
  await createAccount("mallory");
});

describe("POST /api/village/sync", () => {
  it("creates an unclaimed village when logged out", async () => {
    const res = await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, playerTag: TAG, claimed: false, totalActiveUpgrades: 2 });
    expect((await village()).ownerId).toBeNull();
  });

  it("claims an unclaimed village for the logged-in account", async () => {
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    as("alice");
    const body = await (await sync(post("/api/village/sync", { rawJson: exportJson(now()) }))).json();
    expect(body.claimed).toBe(true);
    expect((await village()).ownerId).toBe("alice");
  });

  it("rejects syncs of a claimed village from anyone else", async () => {
    as("alice");
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));

    for (const who of [null, "mallory"]) {
      as(who);
      const res = await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toMatch(/linked to another ClashSync account/);
    }
  });

  it("replaces previous upgrades (cancel + insert) in one go", async () => {
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    expect(await activeUpgrades()).toHaveLength(2);
    expect(await testDb.select().from(upgrades)).toHaveLength(4);
  });

  it("doesn't re-alert an upgrade that was already alerted", async () => {
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const alertedAt = new Date("2026-01-01T00:00:00Z");
    const [cannon] = await activeUpgrades();
    await testDb.update(upgrades).set({ notifiedAt: alertedAt }).where(eq(upgrades.id, cannon.id));

    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const [newCannon, newLab] = await activeUpgrades();
    expect(newCannon.id).not.toBe(cannon.id);
    expect(newCannon.notifiedAt).toEqual(alertedAt);
    expect(newLab.notifiedAt).toBeNull();
  });

  it("keeps a running Research Potion across a re-sync", async () => {
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const t = now();
    const boostEnd = t + 1800; // 30 min of potion left
    await testDb.update(villages).set({ labBoostEndsAt: boostEnd }).where(eq(villages.playerTag, TAG));

    await sync(post("/api/village/sync", { rawJson: exportJson(t) }));
    const [cannon, lab] = await activeUpgrades();
    expect((await village()).labBoostEndsAt).toBe(boostEnd);
    expect(lab.originalFinishTime).toBe(t + 86400);
    expect(lab.currentFinishTime).toBe(t + 86400 - 23 * 1800);
    expect(cannon.currentFinishTime).toBe(cannon.originalFinishTime); // builders untouched
  });

  it("drops a Research Potion that ended before the export", async () => {
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const t = now();
    await testDb.update(villages).set({ labBoostEndsAt: t - 60 }).where(eq(villages.playerTag, TAG));

    await sync(post("/api/village/sync", { rawJson: exportJson(t) }));
    const [, lab] = await activeUpgrades();
    expect((await village()).labBoostEndsAt).toBeNull();
    expect(lab.currentFinishTime).toBe(lab.originalFinishTime);
  });
});

describe("POST /api/village/claim (API-token takeover)", () => {
  beforeEach(async () => {
    as("alice");
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    await testDb
      .update(villages)
      .set({ discordWebhookUrl: "https://discord.com/api/webhooks/123456/abcdefghijklmnopqrstuvwxyz", dmAlerts: true })
      .where(eq(villages.playerTag, TAG));
  });

  it("requires login", async () => {
    as(null);
    const res = await claim(post("/api/village/claim", { tag: TAG, token: "abc" }));
    expect(res.status).toBe(401);
  });

  it("refuses an invalid token and leaves ownership alone", async () => {
    as("mallory");
    tokenValid = false;
    const res = await claim(post("/api/village/claim", { tag: TAG, token: "abc" }));
    expect(res.status).toBe(403);
    expect((await village()).ownerId).toBe("alice");
  });

  it("moves the village to the new owner and switches off the old owner's alerts", async () => {
    as("mallory");
    const res = await claim(post("/api/village/claim", { tag: TAG, token: "abc" }));
    expect(res.status).toBe(200);
    const v = await village();
    expect(v.ownerId).toBe("mallory");
    expect(v.verifiedAt).not.toBeNull();
    expect(v.discordWebhookUrl).toBeNull();
    expect(v.dmAlerts).toBe(false);
  });

  it("keeps alerts when the owner re-verifies", async () => {
    await claim(post("/api/village/claim", { tag: TAG, token: "abc" }));
    const v = await village();
    expect(v.ownerId).toBe("alice");
    expect(v.dmAlerts).toBe(true);
    expect(v.discordWebhookUrl).not.toBeNull();
  });
});
