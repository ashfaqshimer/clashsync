import { boostedFinishTime, POTIONS } from "./boosts";
import { HELPER_IDS, type HelperKind } from "./bedtime";
import { resolveEntity } from "./clash-data";
import { ActiveUpgrade, ParseResult, RawExportVillage, RawVillageItem } from "./types";

const BUILDERS_HUT_ID = 1000015;

/**
 * Formats a duration in seconds into a friendly string (e.g. "2d 14h 32m 10s").
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSecs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || (hours > 0 && days === 0)) parts.push(`${minutes}m`);
  if (days === 0 && hours === 0) parts.push(`${remainingSecs}s`);

  return parts.join(" ") || `${seconds}s`;
}

/**
 * Parses raw JSON string exported from Clash of Clans into structured active upgrades.
 */
export function parseVillageExport(rawJson: string): ParseResult {
  if (!rawJson || !rawJson.trim()) {
    return {
      success: false,
      totalActiveUpgrades: 0,
      builderUpgradesCount: 0,
      labUpgradesCount: 0,
      petUpgradesCount: 0,
      builderBaseUpgradesCount: 0,
      upgrades: [],
      error: "Village data is empty. Please paste your JSON payload.",
    };
  }

  let data: RawExportVillage;
  try {
    data = JSON.parse(rawJson);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Malformed JSON syntax";
    return {
      success: false,
      totalActiveUpgrades: 0,
      builderUpgradesCount: 0,
      labUpgradesCount: 0,
      petUpgradesCount: 0,
      builderBaseUpgradesCount: 0,
      upgrades: [],
      error: `Invalid JSON format: ${message}`,
    };
  }

  // Detect snapshot timestamp or fallback to current epoch
  const nowEpoch = Math.floor(Date.now() / 1000);
  const exportTimestamp =
    typeof data.timestamp === "number" && data.timestamp > 1000000000
      ? data.timestamp
      : nowEpoch;

  const formattedExportTime = new Date(exportTimestamp * 1000).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  const upgrades: ActiveUpgrade[] = [];

  const processSection = (
    items: RawVillageItem[] | undefined,
    sectionName: string
  ) => {
    if (!Array.isArray(items)) return;

    const isBuilderBase = sectionName.endsWith("2");

    items.forEach((item, index) => {
      // Check for active timer
      const timer = typeof item.timer === "number" ? item.timer : 0;
      if (timer > 0) {
        const rawDataId = Number(item.data || item.id || 0);
        const currentLvl = Number(item.lvl || item.level || 0);
        const targetLvl = currentLvl + 1;
        const isGearUp = Boolean(item.gear_up);
        const isGoblinOrHelper = Boolean(item.extra);

        const entity = resolveEntity(rawDataId, item.name, sectionName);
        const originalFinishTime = exportTimestamp + timer;
        const currentFinishTime = originalFinishTime;

        const formattedFinishTime = new Date(
          originalFinishTime * 1000
        ).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });

        upgrades.push({
          id: `${sectionName}-${rawDataId}-${index}-${exportTimestamp}`,
          dataId: rawDataId,
          name: entity.name, // Plain; display labels come from upgradeLabel()
          category: entity.category,
          villageType: isBuilderBase ? "BUILDER_BASE" : "HOME",
          currentLevel: currentLvl,
          targetLevel: targetLvl,
          remainingSeconds: timer,
          originalFinishTime,
          currentFinishTime,
          formattedRemaining: formatDuration(timer),
          formattedFinishTime,
          isGearUp,
          isGoblinOrHelper,
        });
      }
    });
  };

  // Process Home Village collections
  processSection(data.buildings, "buildings");
  processSection(data.heroes, "heroes");
  processSection(data.units, "units");
  processSection(data.spells, "spells");
  processSection(data.siege_machines, "siege_machines");
  processSection(data.pets, "pets");
  processSection(data.traps, "traps");

  // Process Builder Base collections
  processSection(data.buildings2, "buildings2");
  processSection(data.heroes2, "heroes2");
  processSection(data.units2, "units2");
  processSection(data.traps2, "traps2");

  // Fallback: check if the top-level is directly an array
  if (Array.isArray(data)) {
    processSection(data as RawVillageItem[], "items");
  }

  // Potions running at export time: `boosts.builder_boost` / `boosts.lab_boost`
  // are the seconds of boost left. Timers are normal-speed work, so pull
  // finishes in for the home-village upgrades each potion speeds up.
  const applyRunningBoost = (seconds: number, potion: (typeof POTIONS)[keyof typeof POTIONS]) => {
    if (!(seconds > 0)) return undefined;
    for (const u of upgrades) {
      if (u.category !== potion.category || u.villageType !== "HOME") continue;
      u.currentFinishTime = boostedFinishTime(
        u.originalFinishTime,
        exportTimestamp,
        potion.multiplier,
        seconds
      );
      u.formattedRemaining = formatDuration(u.currentFinishTime - exportTimestamp);
      u.formattedFinishTime = new Date(u.currentFinishTime * 1000).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
    return exportTimestamp + seconds;
  };
  const builderBoostEndsAt = applyRunningBoost(
    Number(data.boosts?.builder_boost ?? 0),
    POTIONS.BUILDER_POTION
  );
  const labBoostEndsAt = applyRunningBoost(
    Number(data.boosts?.lab_boost ?? 0),
    POTIONS.RESEARCH_POTION
  );

  // Builder's Huts are grouped by level (`cnt` per entry); a hut that is being
  // upgraded gets its own entry with a `timer` and no `cnt`, so sum them all.
  const huts = Array.isArray(data.buildings)
    ? data.buildings.filter((b) => Number(b.data) === BUILDERS_HUT_ID)
    : [];
  const hutTotal = huts.reduce(
    (sum, b) => sum + (typeof b.cnt === "number" && b.cnt > 0 ? b.cnt : 1),
    0
  );
  const builderHutCount = hutTotal > 0 ? hutTotal : undefined;

  // Helper Hut: level, and `helper_cooldown` = seconds until it can be assigned again
  const helpers: NonNullable<ParseResult["helpers"]> = {};
  for (const kind of Object.keys(HELPER_IDS) as HelperKind[]) {
    const entry = Array.isArray(data.helpers)
      ? data.helpers.find((h) => Number(h.data) === HELPER_IDS[kind])
      : undefined;
    const level = Number(entry?.lvl ?? 0);
    if (!entry || !(level > 0)) continue;
    const cooldown = Number(entry.helper_cooldown ?? 0);
    helpers[kind] = { level, readyAt: exportTimestamp + (cooldown > 0 ? cooldown : 0) };
  }

  // Sort by finish time ascending (soonest first)
  upgrades.sort((a, b) => a.currentFinishTime - b.currentFinishTime);

  const builderUpgradesCount = upgrades.filter(
    (u) => u.category === "BUILDER"
  ).length;
  const labUpgradesCount = upgrades.filter(
    (u) => u.category === "LABORATORY"
  ).length;
  const petUpgradesCount = upgrades.filter(
    (u) => u.category === "PET_HOUSE"
  ).length;
  const builderBaseUpgradesCount = upgrades.filter(
    (u) => u.category === "BUILDER_BASE"
  ).length;

  return {
    success: true,
    playerTag: typeof data.tag === "string" ? data.tag : undefined,
    exportTimestamp,
    formattedExportTime,
    totalActiveUpgrades: upgrades.length,
    builderUpgradesCount,
    labUpgradesCount,
    petUpgradesCount,
    builderBaseUpgradesCount,
    builderHutCount,
    builderBoostEndsAt,
    labBoostEndsAt,
    helpers,
    upgrades,
  };
}
