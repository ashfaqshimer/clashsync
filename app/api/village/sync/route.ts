import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/lib/db";
import { boosts, users, upgrades } from "@/lib/db/schema";
import { parseVillageExport } from "@/lib/parser";
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

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.playerTag, playerTag))
      .limit(1);

    // Claimed villages only sync for their account; a logged-in sync of an
    // unclaimed village claims it (see lib/ownership.ts)
    const access = existingUsers[0]
      ? await getVillageAccess(existingUsers[0])
      : { viewer: await getSessionUser(), canEdit: true, shouldClaim: true, reason: undefined };
    if (!access.canEdit) {
      return NextResponse.json(
        { success: false, error: accessDeniedMessage(playerTag, access.reason) },
        { status: 403 }
      );
    }
    const claimFor = access.shouldClaim ? (access.viewer?.id ?? null) : null;

    // The export is the new source of truth for builder boosts. The export
    // format has no known research-boost field, so that resets to none.
    const boostFields = {
      builderBoostEndsAt: parseResult.builderBoostEndsAt ?? null,
      labBoostEndsAt: null,
    };

    // All writes go in one batch so a failure can't leave the village with its
    // old upgrades cancelled but no new ones (neon-http has no transactions).
    const user = existingUsers[0];
    const userId = user?.id ?? crypto.randomUUID();
    const updatedAt = new Date();

    const statements: BatchItem<"pg">[] = user
      ? [
          db
            .update(users)
            .set({
              lastExportTimestamp: exportTimestamp,
              ...(parseResult.builderHutCount
                ? { builderCount: parseResult.builderHutCount }
                : {}),
              ...boostFields,
              updatedAt,
            })
            .where(eq(users.id, userId)),
          // Potions applied before this sync can no longer be undone
          db
            .update(boosts)
            .set({ status: "SUPERSEDED" })
            .where(and(eq(boosts.userId, userId), eq(boosts.status, "APPLIED"))),
          // Upgrades from the previous sync are replaced by this one
          db
            .update(upgrades)
            .set({ status: "CANCELLED", updatedAt })
            .where(and(eq(upgrades.userId, userId), eq(upgrades.status, "ACTIVE"))),
          ...(claimFor
            ? [
                db
                  .update(users)
                  .set({ ownerId: claimFor })
                  .where(and(eq(users.id, userId), isNull(users.ownerId))),
              ]
            : []),
        ]
      : [
          db.insert(users).values({
            id: userId,
            playerTag,
            ownerId: claimFor,
            lastExportTimestamp: exportTimestamp,
            builderCount: parseResult.builderHutCount ?? null,
            ...boostFields,
          }),
        ];

    if (parseResult.upgrades.length > 0) {
      statements.push(
        db.insert(upgrades).values(
          parseResult.upgrades.map((item) => ({
            id: crypto.randomUUID(),
            userId,
            dataId: item.dataId,
            entityName: item.name,
            category: item.category,
            villageType: item.villageType,
            currentLevel: item.currentLevel,
            targetLevel: item.targetLevel,
            remainingSecondsAtExport: item.remainingSeconds,
            originalFinishTime: item.originalFinishTime,
            currentFinishTime: item.currentFinishTime,
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
      userId,
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

