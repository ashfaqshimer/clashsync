import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("@/lib/db", async () => (await import("./test-db")).dbModule());

const { testDb, resetTestDb, createAccount, villages, upgrades } = await import("./test-db");
const { runNotificationSweep } = await import("@/lib/notify");
const { SWEEP_INTERVAL_SECONDS } = await import("@/lib/alerts");

const NOW = 1_800_000_000;
const WEBHOOK = "https://discord.com/api/webhooks/123456/abcdefghijklmnopqrstuvwxyz";

/** Discord API stand-in: records calls, answers with the given status per kind. */
let replies: { webhook: number; dm: number };
let calls: { kind: "webhook" | "dm"; content: string }[];

beforeEach(async () => {
  await resetTestDb();
  process.env.DISCORD_BOT_TOKEN = "test-bot-token";
  replies = { webhook: 204, dm: 200 };
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body ?? "{}"));
    if (url.includes("/webhooks/")) {
      calls.push({ kind: "webhook", content: body.content });
      return new Response(null, { status: replies.webhook });
    }
    if (url.endsWith("/users/@me/channels")) {
      return new Response(JSON.stringify({ id: "dm-channel" }), { status: 200 });
    }
    calls.push({ kind: "dm", content: body.content });
    return new Response("{}", { status: replies.dm });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function seedVillage(opts: { lead?: number; webhook?: boolean; dm?: boolean } = {}) {
  await createAccount("alice", "discord-alice");
  await testDb.insert(villages).values({
    id: "v1",
    playerTag: "#PYL",
    ownerId: "alice",
    alertLeadMinutes: opts.lead ?? 5,
    discordWebhookUrl: opts.webhook === false ? null : WEBHOOK,
    dmAlerts: opts.dm ?? false,
  });
}

let seq = 0;
async function seedUpgrade(finishIn: number, name = `Upgrade ${++seq}`) {
  const id = `u${++seq}`;
  await testDb.insert(upgrades).values({
    id,
    villageId: "v1",
    dataId: 1000008,
    entityName: name,
    category: "BUILDER",
    currentLevel: 1,
    targetLevel: 2,
    remainingSecondsAtExport: 100,
    originalFinishTime: NOW + finishIn,
    currentFinishTime: NOW + finishIn,
  });
  return id;
}

const notified = async (id: string) =>
  (await testDb.select().from(upgrades).where(eq(upgrades.id, id)))[0].notifiedAt;

describe("runNotificationSweep", () => {
  it("alerts within lead + one sweep interval, and not earlier", async () => {
    await seedVillage({ lead: 5 });
    const inWindow = await seedUpgrade(5 * 60 + SWEEP_INTERVAL_SECONDS, "Cannon");
    const tooEarly = await seedUpgrade(5 * 60 + SWEEP_INTERVAL_SECONDS + 1, "Mortar");

    const summary = await runNotificationSweep(NOW);
    expect(summary).toMatchObject({ claimed: 1, sent: 1 });
    expect(await notified(inWindow)).not.toBeNull();
    expect(await notified(tooEarly)).toBeNull();
    expect(calls).toHaveLength(1);
    expect(calls[0].content).toContain("**Cannon Level 2** finishes <t:");
  });

  it("with lead 0, alerts only once the upgrade is done", async () => {
    await seedVillage({ lead: 0 });
    const done = await seedUpgrade(-30);
    const soon = await seedUpgrade(60);
    await runNotificationSweep(NOW);
    expect(await notified(done)).not.toBeNull();
    expect(await notified(soon)).toBeNull();
    expect(calls[0].content).toContain("is ready");
  });

  it("never alerts the same upgrade twice", async () => {
    await seedVillage();
    await seedUpgrade(60);
    await runNotificationSweep(NOW);
    const second = await runNotificationSweep(NOW + SWEEP_INTERVAL_SECONDS);
    expect(second.claimed).toBe(0);
    expect(calls).toHaveLength(1);
  });

  it("skips upgrades that finished long ago", async () => {
    await seedVillage();
    await seedUpgrade(-31 * 60);
    expect(await runNotificationSweep(NOW)).toMatchObject({ claimed: 1, skippedStale: 1, sent: 0 });
    expect(calls).toHaveLength(0);
  });

  it("sends to both the webhook and a DM, in one message per village", async () => {
    await seedVillage({ dm: true });
    await seedUpgrade(60);
    await seedUpgrade(90);
    expect(await runNotificationSweep(NOW)).toMatchObject({ claimed: 2, sent: 2 });
    expect(calls.map((c) => c.kind).sort()).toEqual(["dm", "webhook"]);
    expect(calls[0].content).toContain("**2 upgrades**");
  });

  it("skips villages with no alert destination", async () => {
    await seedVillage({ webhook: false, dm: false });
    await seedUpgrade(60);
    expect(await runNotificationSweep(NOW)).toMatchObject({ skippedNoDestination: 1 });
  });

  it("releases the claim for a retry when nothing got through", async () => {
    await seedVillage({ dm: true });
    const id = await seedUpgrade(60);
    replies = { webhook: 503, dm: 503 };
    expect(await runNotificationSweep(NOW)).toMatchObject({ retrying: 1 });
    expect(await notified(id)).toBeNull();

    replies = { webhook: 204, dm: 200 };
    expect(await runNotificationSweep(NOW + SWEEP_INTERVAL_SECONDS)).toMatchObject({ sent: 1 });
  });

  it("doesn't retry when one destination succeeded (avoids duplicates)", async () => {
    await seedVillage({ dm: true });
    const id = await seedUpgrade(60);
    replies = { webhook: 503, dm: 200 };
    expect(await runNotificationSweep(NOW)).toMatchObject({ sent: 1, retrying: 0 });
    expect(await notified(id)).not.toBeNull();
  });
});
