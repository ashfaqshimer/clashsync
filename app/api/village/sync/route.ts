import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNotNull, isNull } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/lib/db";
import { boosts, villages, upgrades } from "@/lib/db/schema";
import { parseVillageExport } from "@/lib/parser";
import { carryOverNotified } from "@/lib/alerts";
import { finishWithRunningBoost, POTIONS } from "@/lib/boosts";
import { getSessionUser } from "@/lib/auth";
import { accessDeniedMessage, getVillageAccess } from "@/lib/ownership";
import { normalizeTag, tagToSlug } from "@/lib/tags";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawJson = body.rawJson || body.json;

    if (!rawJson || typeof rawJson !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing 'rawJson' payload in request body" },
        { status: 400 }
      );
    }

    const parseResult = parseVillageExport(rawJson);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error },
        { status: 400 }
      );
    }

    const playerTag = normalizeTag(parseResult.playerTag || body.playerTag);
    if (!playerTag) {
      return NextResponse.json(
        {
          success: false,
          error:
            "We couldn't find your player tag in this export. Copy the full export from the game and try again.",
        },
        { status: 400 }
      );
    }
    const exportTimestamp = parseResult.exportTimestamp || Math.floor(Date.now() / 1000);

    const existingVillages = await db
      .select()
      .from(villages)
      .where(eq(villages.playerTag, playerTag))
      .limit(1);

    // Claimed villages only sync for their account; a logged-in sync of an
    // unclaimed village claims it (see lib/ownership.ts)
    const access = existingVillages[0]
      ? await getVillageAccess(existingVillages[0])
      : { viewer: await getSessionUser(), canEdit: true, shouldClaim: true };
    if (!access.canEdit) {
      return NextResponse.json(
        { success: false, error: accessDeniedMessage(playerTag) },
        { status: 403 }
      );
    }
    const claimFor = access.shouldClaim ? (access.viewer?.id ?? null) : null;

    // The export is the source of truth for builder boosts. It has no
    // research-boost field, so a Research Potion applied in the app that is
    // still running at export time is kept and re-applied to lab timers.
    const runningLabBoost =
      existingVillages[0]?.labBoostEndsAt && existingVillages[0].labBoostEndsAt > exportTimestamp
        ? existingVillages[0].labBoostEndsAt
        : null;
    const boostFields = {
      builderBoostEndsAt: parseResult.builderBoostEndsAt ?? null,
      labBoostEndsAt: runningLabBoost,
    };
    const finishTimeFor = (item: (typeof parseResult.upgrades)[number]) =>
      item.category === POTIONS.RESEARCH_POTION.category && item.villageType === "HOME"
        ? finishWithRunningBoost(
            item.currentFinishTime,
            exportTimestamp,
            runningLabBoost,
            POTIONS.RESEARCH_POTION.multiplier
          )
        : item.currentFinishTime;

    // All writes go in one batch so a failure can't leave the village with its
    // old upgrades cancelled but no new ones (neon-http has no transactions).
    const village = existingVillages[0];
    const villageId = village?.id ?? crypto.randomUUID();
    const updatedAt = new Date();

    const statements: BatchItem<"pg">[] = village
      ? [
          db
            .update(villages)
            .set({
              lastExportTimestamp: exportTimestamp,
              ...(parseResult.builderHutCount
                ? { builderCount: parseResult.builderHutCount }
                : {}),
              ...boostFields,
              updatedAt,
            })
            .where(eq(villages.id, villageId)),
          // Potions applied before this sync can no longer be undone
          db
            .update(boosts)
            .set({ status: "SUPERSEDED" })
            .where(and(eq(boosts.villageId, villageId), eq(boosts.status, "APPLIED"))),
          // Upgrades from the previous sync are replaced by this one
          db
            .update(upgrades)
            .set({ status: "CANCELLED", updatedAt })
            .where(and(eq(upgrades.villageId, villageId), eq(upgrades.status, "ACTIVE"))),
          ...(claimFor
            ? [
                db
                  .update(villages)
                  .set({ ownerId: claimFor })
                  .where(and(eq(villages.id, villageId), isNull(villages.ownerId))),
              ]
            : []),
        ]
      : [
          db.insert(villages).values({
            id: villageId,
            playerTag,
            ownerId: claimFor,
            lastExportTimestamp: exportTimestamp,
            builderCount: parseResult.builderHutCount ?? null,
            ...boostFields,
          }),
        ];

    if (parseResult.upgrades.length > 0) {
      // Don't re-alert upgrades the previous sync already alerted
      const previous = village
        ? await db
            .select({
              dataId: upgrades.dataId,
              targetLevel: upgrades.targetLevel,
              villageType: upgrades.villageType,
              isGearUp: upgrades.isGearUp,
              notifiedAt: upgrades.notifiedAt,
            })
            .from(upgrades)
            .where(
              and(
                eq(upgrades.villageId, villageId),
                eq(upgrades.status, "ACTIVE"),
                isNotNull(upgrades.notifiedAt)
              )
            )
        : [];
      const notified = carryOverNotified(
        previous,
        parseResult.upgrades.map((item) => ({ ...item, isGearUp: Boolean(item.isGearUp) }))
      );

      statements.push(
        db.insert(upgrades).values(
          parseResult.upgrades.map((item, i) => ({
            notifiedAt: notified[i],
            id: crypto.randomUUID(),
            villageId,
            dataId: item.dataId,
            entityName: item.name,
            category: item.category,
            villageType: item.villageType,
            currentLevel: item.currentLevel,
            targetLevel: item.targetLevel,
            remainingSecondsAtExport: item.remainingSeconds,
            originalFinishTime: item.originalFinishTime,
            currentFinishTime: finishTimeFor(item),
            status: "ACTIVE",
            isGearUp: Boolean(item.isGearUp),
            isExtraSlot: Boolean(item.isGoblinOrHelper),
          }))
        )
      );
    }

    await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

    return NextResponse.json({
      success: true,
      playerTag,
      dashboardPath: `/v/${tagToSlug(playerTag)}`,
      villageId,
      // True when this sync linked the village to the logged-in account
      claimed: claimFor !== null,
      exportTimestamp,
      totalActiveUpgrades: parseResult.totalActiveUpgrades,
      builderUpgradesCount: parseResult.builderUpgradesCount,
      labUpgradesCount: parseResult.labUpgradesCount,
      petUpgradesCount: parseResult.petUpgradesCount,
      builderBaseUpgradesCount: parseResult.builderBaseUpgradesCount,
      upgrades: parseResult.upgrades,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json(
      { success: false, error: `Failed to sync village to database: ${message}` },
      { status: 500 }
    );
  }
}

