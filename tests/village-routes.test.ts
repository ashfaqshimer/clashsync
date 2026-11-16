import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

vi.mock("@/lib/db", async () => (await import("./test-db")).dbModule());

let viewer: { id: string; name: string; image: null } | null = null;
vi.mock("@/lib/auth", () => ({ getSessionUser: async () => viewer }));

let tokenValid = true;
let apiProfile: { name: string; townHallLevel: number } | null = null;
vi.mock("@/lib/clash-api", () => ({
  verifyPlayerToken: async () =>
    tokenValid ? { ok: true } : { ok: false, reason: "invalid", error: "That API token isn't valid." },
  fetchPlayerProfile: async () =>
    apiProfile ? { success: true, player: apiProfile } : { success: false, error: "unavailable" },
}));

const { testDb, resetTestDb, createAccount, villages, upgrades } = await import("./test-db");
const { POST: sync } = await import("@/app/api/village/sync/route");
const { POST: claim } = await import("@/app/api/village/claim/route");
const { POST: boost, DELETE: undoBoost } = await import("@/app/api/village/boosts/route");

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
const currentUpgrades = async () =>
  (await testDb.select().from(upgrades)).sort((a, b) => a.dataId - b.dataId);

beforeEach(async () => {
  await resetTestDb();
  as(null);
  tokenValid = true;
  apiProfile = null;
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

  it("stores the player name from the API, and keeps it when a later lookup fails", async () => {
    apiProfile = { name: "Chief Ada", townHallLevel: 16 };
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    expect(await village()).toMatchObject({ playerName: "Chief Ada", townHallLevel: 16 });

    apiProfile = null;
    const res = await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    expect(res.status).toBe(200);
    expect(await village()).toMatchObject({ playerName: "Chief Ada", townHallLevel: 16 });
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

  it("replaces the previous upgrades (delete + insert) in one go", async () => {
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const first = await currentUpgrades();
    await sync(post("/api/village/sync", { rawJson: exportJson(now(), { units: [] }) }));
    const second = await currentUpgrades();
    expect(second).toHaveLength(1); // the finished lab upgrade is gone, not kept as history
    expect(second[0].id).not.toBe(first[0].id);
  });

  it("stores plain entity names (labels are display-only)", async () => {
    const json = exportJson(now(), { buildings: [{ data: 1000008, lvl: 20, timer: 3600, gear_up: 1 }] });
    await sync(post("/api/village/sync", { rawJson: json }));
    const [cannon] = await currentUpgrades();
    expect(cannon.isGearUp).toBe(true);
    expect(cannon.entityName).not.toMatch(/Gear-Up/);
  });

  it("doesn't re-alert an upgrade that was already alerted", async () => {
    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const alertedAt = new Date("2026-01-01T00:00:00Z");
    const [cannon] = await currentUpgrades();
    await testDb.update(upgrades).set({ notifiedAt: alertedAt }).where(eq(upgrades.id, cannon.id));

    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const [newCannon, newLab] = await currentUpgrades();
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
    const [cannon, lab] = await currentUpgrades();
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
    const [, lab] = await currentUpgrades();
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

describe("getOwnedVillages", () => {
  it("returns the stored name and raw finish times, with builder timers split out", async () => {
    const { getOwnedVillages } = await import("@/lib/village");
    apiProfile = { name: "Chief Ada", townHallLevel: 16 };
    as("alice");
    const ts = now();
    await sync(
      post("/api/village/sync", {
        rawJson: exportJson(ts, {
          buildings: [
            { data: 1000008, lvl: 20, timer: 3600 },
            { data: 1000008, lvl: 20, timer: 7200, extra: true }, // Goblin: not a builder slot
            { data: 1000015, lvl: 4, cnt: 3 },
          ],
        }),
      })
    );
    const [row] = await getOwnedVillages("alice");
    expect(row).toMatchObject({ playerTag: TAG, playerName: "Chief Ada", townHallLevel: 16, builderCount: 3 });
    expect(row.finishTimes.sort()).toEqual([ts + 3600, ts + 7200, ts + 86400]);
    expect(row.builderFinishTimes).toEqual([ts + 3600]);
    expect(await getOwnedVillages("mallory")).toEqual([]);
  });
});

describe("helpers via /api/village/boosts", () => {
  const H = 3600;
  // Builder 20h left, lab research 30h left; Apprentice lvl 8 ready, Lab Assistant lvl 12 ready
  const syncWithHelpers = async (cooldown = 0) => {
    await sync(
      post("/api/village/sync", {
        rawJson: exportJson(now(), {
          buildings: [{ data: 1000008, lvl: 20, timer: 20 * H }],
          units: [{ data: 4000000, lvl: 5, timer: 30 * H }],
          helpers: [
            { data: 93000000, lvl: 8, helper_cooldown: cooldown },
            { data: 93000001, lvl: 12, helper_cooldown: cooldown },
          ],
        }),
      })
    );
    const [builder, lab] = await currentUpgrades();
    return { builder, lab };
  };
  const del = (body: unknown) =>
    new NextRequest("http://localhost/api/village/boosts", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("logs a helper use: level hours off, helper busy until the shared reset, and undo restores both", async () => {
    const { builder } = await syncWithHelpers();
    const res = await boost(post("/api/village/boosts", { tag: TAG, kind: "BUILDER_APPRENTICE", upgradeId: builder.id }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.savedSeconds).toBe(8 * H);
    const after = (await currentUpgrades())[0];
    expect(after.currentFinishTime).toBe(builder.currentFinishTime - 8 * H);
    const v = await village();
    expect(v.apprenticeReadyAt).toBeGreaterThanOrEqual(now() + 23 * H - 5);

    // Can't use it twice
    const again = await boost(post("/api/village/boosts", { tag: TAG, kind: "BUILDER_APPRENTICE", upgradeId: builder.id }));
    expect(again.status).toBe(409);

    // The Lab Assistant shares today's clock
    const lab = (await currentUpgrades())[1];
    await boost(post("/api/village/boosts", { tag: TAG, kind: "LAB_ASSISTANT", upgradeId: lab.id }));
    expect((await village()).labAssistantReadyAt).toBe(v.apprenticeReadyAt);

    // Undo the latest (the Lab Assistant)
    const undone = await undoBoost(del({ tag: TAG }));
    expect(await undone.json()).toMatchObject({ success: true, undone: "LAB_ASSISTANT" });
    expect((await currentUpgrades())[1].currentFinishTime).toBe(lab.currentFinishTime);
    expect((await village()).labAssistantReadyAt).toBe(v.labAssistantReadyAt);
  });

  it("rejects a helper that's resting, the wrong slot, or a village without one", async () => {
    const { builder } = await syncWithHelpers(5 * H);
    const resting = await boost(post("/api/village/boosts", { tag: TAG, kind: "BUILDER_APPRENTICE", upgradeId: builder.id }));
    expect(resting.status).toBe(409);

    await syncWithHelpers(0);
    const [, l2] = await currentUpgrades();
    const wrongSlot = await boost(post("/api/village/boosts", { tag: TAG, kind: "BUILDER_APPRENTICE", upgradeId: l2.id }));
    expect(wrongSlot.status).toBe(400);

    await sync(post("/api/village/sync", { rawJson: exportJson(now()) }));
    const [b3] = await currentUpgrades();
    const none = await boost(post("/api/village/boosts", { tag: TAG, kind: "BUILDER_APPRENTICE", upgradeId: b3.id }));
    expect(none.status).toBe(409);
  });
});
