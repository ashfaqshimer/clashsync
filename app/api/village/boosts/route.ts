import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/lib/db";
import { boosts, upgrades, villages, type BoostChange, type Village } from "@/lib/db/schema";
import { boostedFinishTime, nextBoostWindow, POTIONS, type PotionKind } from "@/lib/boosts";
import { accessDeniedMessage, getVillageAccess } from "@/lib/ownership";
import { normalizeTag } from "@/lib/tags";

type Body = { tag?: unknown; kind?: unknown };

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

/** Shared preamble: parse body, find the village, check it may be changed. */
async function loadVillage(
  request: NextRequest
): Promise<{ village: Village; body: Body } | NextResponse> {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const tag = normalizeTag(typeof body.tag === "string" ? body.tag : null);
  if (!tag) return fail("That doesn't look like a valid player tag.", 400);

  const [village] = await db.select().from(villages).where(eq(villages.playerTag, tag)).limit(1);
  if (!village) return fail(`${tag} hasn't been synced yet.`, 404);
  const access = await getVillageAccess(village);
  if (!access.canEdit) return fail(accessDeniedMessage(tag), 403);

  return { village, body };
}

const boostEndColumn = (kind: PotionKind) =>
  kind === "BUILDER_POTION" ? "builderBoostEndsAt" : "labBoostEndsAt";

/** POST { tag, kind } → apply a potion to the village's running upgrades. */
export async function POST(request: NextRequest) {
  try {
    const loaded = await loadVillage(request);
    if (loaded instanceof NextResponse) return loaded;
    const { village, body } = loaded;

    if (body.kind !== "BUILDER_POTION" && body.kind !== "RESEARCH_POTION") {
      return fail("Unknown potion.", 400);
    }
    const kind: PotionKind = body.kind;
    const spec = POTIONS[kind];
    const endColumn = boostEndColumn(kind);

    const now = Math.floor(Date.now() / 1000);
    const window = nextBoostWindow(now, village[endColumn], spec.durationSeconds);

    const targets = await db
      .select({ id: upgrades.id, currentFinishTime: upgrades.currentFinishTime })
      .from(upgrades)
      .where(
        and(
          eq(upgrades.villageId, village.id),
          eq(upgrades.status, "ACTIVE"),
          eq(upgrades.category, spec.category),
          eq(upgrades.villageType, "HOME"),
          gt(upgrades.currentFinishTime, window.start)
        )
      );

    if (targets.length === 0) {
      return fail(
        spec.category === "BUILDER"
          ? "No builder upgrades would be sped up by a potion right now."
          : "No lab research would be sped up by a potion right now.",
        409
      );
    }

    const changes: BoostChange[] = targets.map((t) => ({
      upgradeId: t.id,
      from: t.currentFinishTime,
      to: boostedFinishTime(t.currentFinishTime, window.start, spec.multiplier, spec.durationSeconds),
    }));

    const updatedAt = new Date();
    const statements: BatchItem<"pg">[] = [
      ...changes.map((c) =>
        db
          .update(upgrades)
          .set({ currentFinishTime: c.to, updatedAt })
          .where(and(eq(upgrades.id, c.upgradeId), eq(upgrades.currentFinishTime, c.from)))
      ),
      db
        .update(villages)
        .set({ [endColumn]: window.end, updatedAt })
        .where(eq(villages.id, village.id)),
      db.insert(boosts).values({
        id: crypto.randomUUID(),
        villageId: village.id,
        kind,
        windowStart: window.start,
        windowEnd: window.end,
        previousBoostEndsAt: village[endColumn],
        changes,
      }),
    ];
    await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

    const savedSeconds = changes.reduce((sum, c) => sum + (c.from - c.to), 0);
    return NextResponse.json({
      success: true,
      kind,
      boostEndsAt: window.end,
      upgradesBoosted: changes.length,
      savedSeconds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return fail(`Couldn't apply the potion: ${message}`, 500);
  }
}

/** DELETE { tag } → undo the most recent potion, if nothing has changed since. */
export async function DELETE(request: NextRequest) {
  try {
    const loaded = await loadVillage(request);
    if (loaded instanceof NextResponse) return loaded;
    const { village } = loaded;

    const [latest] = await db
      .select()
      .from(boosts)
      .where(and(eq(boosts.villageId, village.id), eq(boosts.status, "APPLIED")))
      .orderBy(desc(boosts.createdAt))
      .limit(1);

    if (!latest) return fail("There's no potion to undo.", 404);

    const kind = latest.kind as PotionKind;
    const endColumn = boostEndColumn(kind);
    const ids = latest.changes.map((c) => c.upgradeId);
    const current = await db
      .select({ id: upgrades.id, status: upgrades.status, currentFinishTime: upgrades.currentFinishTime })
      .from(upgrades)
      .where(inArray(upgrades.id, ids));

    const untouched =
      village[endColumn] === latest.windowEnd &&
      latest.changes.every((c) => {
        const row = current.find((r) => r.id === c.upgradeId);
        return row?.status === "ACTIVE" && row.currentFinishTime === c.to;
      });

    if (!untouched) {
      await db.update(boosts).set({ status: "SUPERSEDED" }).where(eq(boosts.id, latest.id));
      return fail("Your timers changed since that potion, so it can't be undone.", 409);
    }

    const updatedAt = new Date();
    const now = Math.floor(Date.now() / 1000);
    const statements: BatchItem<"pg">[] = [
      ...latest.changes.map((c) =>
        db
          .update(upgrades)
          // If the potion made it finish (and alert) early, re-arm the alert
          .set({ currentFinishTime: c.from, updatedAt, ...(c.from > now ? { notifiedAt: null } : {}) })
          .where(eq(upgrades.id, c.upgradeId))
      ),
      db
        .update(villages)
        .set({ [endColumn]: latest.previousBoostEndsAt, updatedAt })
        .where(eq(villages.id, village.id)),
      db.update(boosts).set({ status: "UNDONE" }).where(eq(boosts.id, latest.id)),
    ];
    await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

    return NextResponse.json({ success: true, undone: kind });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return fail(`Couldn't undo the potion: ${message}`, 500);
  }
}
