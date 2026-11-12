import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, upgrades } from "@/lib/db/schema";
import { formatDuration } from "@/lib/parser";
import { normalizeTag } from "@/lib/tags";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");

  if (!tag) {
    return NextResponse.json(
      { success: false, error: "Missing 'tag' query parameter" },
      { status: 400 }
    );
  }

  const formattedTag = normalizeTag(tag);
  if (!formattedTag) {
    return NextResponse.json(
      { success: false, error: "That doesn't look like a valid player tag." },
      { status: 400 }
    );
  }

  try {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.playerTag, formattedTag))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: `No village synced yet for tag ${formattedTag}` },
        { status: 404 }
      );
    }

    const user = existingUsers[0];

    const activeUpgrades = await db
      .select()
      .from(upgrades)
      .where(
        and(eq(upgrades.userId, user.id), eq(upgrades.status, "ACTIVE"))
      )
      .orderBy(upgrades.currentFinishTime);

    const nowEpoch = Math.floor(Date.now() / 1000);

    const formattedList = activeUpgrades.map((item) => {
      const remainingSeconds = Math.max(0, item.currentFinishTime - nowEpoch);
      return {
        id: item.id,
        dataId: item.dataId,
        name: item.entityName,
        category: item.category,
        villageType: item.villageType,
        currentLevel: item.currentLevel,
        targetLevel: item.targetLevel,
        remainingSeconds,
        originalFinishTime: item.originalFinishTime,
        currentFinishTime: item.currentFinishTime,
        formattedRemaining: formatDuration(remainingSeconds),
        formattedFinishTime: new Date(item.currentFinishTime * 1000).toLocaleString(
          undefined,
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        ),
        isGearUp: item.isGearUp,
        isGoblinOrHelper: item.isExtraSlot,
      };
    });

    return NextResponse.json({
      success: true,
      playerTag: user.playerTag,
      lastExportTimestamp: user.lastExportTimestamp,
      totalActiveUpgrades: formattedList.length,
      upgrades: formattedList,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database query error";
    return NextResponse.json(
      { success: false, error: `Failed to fetch village upgrades: ${message}` },
      { status: 500 }
    );
  }
}

