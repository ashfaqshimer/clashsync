import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, upgrades } from "@/lib/db/schema";
import { parseVillageExport } from "@/lib/parser";

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

    const playerTag = parseResult.playerTag || body.playerTag || "#UNKNOWN";
    const exportTimestamp = parseResult.exportTimestamp || Math.floor(Date.now() / 1000);

    // 1. Find or create user
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.playerTag, playerTag))
      .limit(1);

    let userId: string;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      await db
        .update(users)
        .set({
          lastExportTimestamp: exportTimestamp,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        playerTag,
        lastExportTimestamp: exportTimestamp,
      });
    }

    // 2. Mark existing ACTIVE upgrades as CANCELLED (replaced by new sync)
    await db
      .update(upgrades)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(
        and(eq(upgrades.userId, userId), eq(upgrades.status, "ACTIVE"))
      );

    // 3. Insert newly parsed active upgrades
    if (parseResult.upgrades.length > 0) {
      const recordsToInsert = parseResult.upgrades.map((item) => ({
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
      }));

      await db.insert(upgrades).values(recordsToInsert);
    }

    return NextResponse.json({
      success: true,
      playerTag,
      userId,
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
