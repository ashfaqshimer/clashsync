import { UpgradeType } from "./types";

export interface EntityInfo {
  name: string;
  category: UpgradeType;
}

// Complete and verified Clash of Clans item ID mappings
export const CLASH_ENTITIES: Record<number, EntityInfo> = {
  // --- Home Village Defenses & Core Buildings ---
  1000000: { name: "Army Camp", category: "BUILDER" },
  1000001: { name: "Town Hall", category: "BUILDER" },
  1000002: { name: "Elixir Collector", category: "BUILDER" },
  1000003: { name: "Elixir Storage", category: "BUILDER" },
  1000004: { name: "Gold Mine", category: "BUILDER" },
  1000005: { name: "Gold Storage", category: "BUILDER" },
  1000006: { name: "Barracks", category: "BUILDER" },
  1000007: { name: "Laboratory", category: "BUILDER" },
  1000008: { name: "Cannon", category: "BUILDER" },
  1000009: { name: "Archer Tower", category: "BUILDER" },
  1000010: { name: "Wall", category: "BUILDER" },
  1000011: { name: "Wizard Tower", category: "BUILDER" },
  1000012: { name: "Air Defense", category: "BUILDER" },
  1000013: { name: "Mortar", category: "BUILDER" },
  1000014: { name: "Clan Castle", category: "BUILDER" },
  1000015: { name: "Builder's Hut", category: "BUILDER" },
  1000019: { name: "Hidden Tesla", category: "BUILDER" },
  1000020: { name: "Spell Factory", category: "BUILDER" },
  1000021: { name: "X-Bow", category: "BUILDER" },
  1000023: { name: "Dark Elixir Drill", category: "BUILDER" },
  1000024: { name: "Dark Elixir Storage", category: "BUILDER" },
  1000026: { name: "Dark Barracks", category: "BUILDER" },
  1000027: { name: "Inferno Tower", category: "BUILDER" },
  1000028: { name: "Air Sweeper", category: "BUILDER" },
  1000029: { name: "Dark Spell Factory", category: "BUILDER" },
  1000031: { name: "Eagle Artillery", category: "BUILDER" },
  1000032: { name: "Bomb Tower", category: "BUILDER" },
  1000059: { name: "Workshop", category: "BUILDER" },
  1000067: { name: "Scattershot", category: "BUILDER" },
  1000068: { name: "Pet House", category: "BUILDER" },
  1000070: { name: "Blacksmith", category: "BUILDER" },
  1000071: { name: "Hero Hall", category: "BUILDER" },
  1000072: { name: "Spell Tower", category: "BUILDER" },
  1000077: { name: "Monolith", category: "BUILDER" },
  1000079: { name: "Multi-Gear Tower", category: "BUILDER" },
  1000084: { name: "Multi-Archer Tower", category: "BUILDER" },
  1000085: { name: "Ricochet Cannon", category: "BUILDER" },
  1000086: { name: "Super Wizard Tower", category: "BUILDER" },
  1000089: { name: "Firespitter", category: "BUILDER" },
  1000093: { name: "Multi-Inferno Tower", category: "BUILDER" },
  1000097: { name: "Crafted Defense", category: "BUILDER" },
  1000102: { name: "Merged Defense", category: "BUILDER" },

  // --- Home Village Traps ---
  12000000: { name: "Bomb", category: "BUILDER" },
  12000001: { name: "Spring Trap", category: "BUILDER" },
  12000002: { name: "Giant Bomb", category: "BUILDER" },
  12000005: { name: "Air Bomb", category: "BUILDER" },
  12000006: { name: "Seeking Air Mine", category: "BUILDER" },
  12000008: { name: "Skeleton Trap", category: "BUILDER" },
  12000016: { name: "Tornado Trap", category: "BUILDER" },
  12000020: { name: "Giga Bomb", category: "BUILDER" },

  // --- Heroes ---
  28000000: { name: "Barbarian King", category: "BUILDER" },
  28000001: { name: "Archer Queen", category: "BUILDER" },
  28000002: { name: "Grand Warden", category: "BUILDER" },
  28000003: { name: "Battle Machine", category: "BUILDER_BASE" },
  28000004: { name: "Royal Champion", category: "BUILDER" },
  28000005: { name: "Battle Copter", category: "BUILDER_BASE" },
  28000006: { name: "Minion Prince", category: "BUILDER" },
  28000007: { name: "Hero", category: "BUILDER" },

  // --- Hero Pets (Pet House) ---
  73000000: { name: "L.A.S.S.I", category: "PET_HOUSE" },
  73000001: { name: "Mighty Yak", category: "PET_HOUSE" },
  73000002: { name: "Electro Owl", category: "PET_HOUSE" },
  73000003: { name: "Unicorn", category: "PET_HOUSE" },
  73000004: { name: "Phoenix", category: "PET_HOUSE" },
  73000007: { name: "Poison Lizard", category: "PET_HOUSE" },
  73000008: { name: "Diggy", category: "PET_HOUSE" },
  73000009: { name: "Frosty", category: "PET_HOUSE" },
  73000010: { name: "Spirit Fox", category: "PET_HOUSE" },
  73000011: { name: "Angry Jelly", category: "PET_HOUSE" },
  73000016: { name: "Sneezy", category: "PET_HOUSE" },

  // --- Troops (Laboratory) ---
  4000000: { name: "Barbarian", category: "LABORATORY" },
  4000001: { name: "Archer", category: "LABORATORY" },
  4000002: { name: "Goblin", category: "LABORATORY" },
  4000003: { name: "Giant", category: "LABORATORY" },
  4000004: { name: "Wall Breaker", category: "LABORATORY" },
  4000005: { name: "Balloon", category: "LABORATORY" },
  4000006: { name: "Wizard", category: "LABORATORY" },
  4000007: { name: "Healer", category: "LABORATORY" },
  4000008: { name: "Dragon", category: "LABORATORY" },
  4000009: { name: "P.E.K.K.A", category: "LABORATORY" },
  4000010: { name: "Minion", category: "LABORATORY" },
  4000011: { name: "Hog Rider", category: "LABORATORY" },
  4000012: { name: "Valkyrie", category: "LABORATORY" },
  4000013: { name: "Golem", category: "LABORATORY" },
  4000015: { name: "Witch", category: "LABORATORY" },
  4000017: { name: "Lava Hound", category: "LABORATORY" },
  4000022: { name: "Bowler", category: "LABORATORY" },
  4000023: { name: "Baby Dragon", category: "LABORATORY" },
  4000024: { name: "Miner", category: "LABORATORY" },
  4000053: { name: "Yeti", category: "LABORATORY" },
  4000058: { name: "Ice Golem", category: "LABORATORY" },
  4000059: { name: "Electro Dragon", category: "LABORATORY" },
  4000065: { name: "Dragon Rider", category: "LABORATORY" },
  4000082: { name: "Headhunter", category: "LABORATORY" },
  4000095: { name: "Electro Titan", category: "LABORATORY" },
  4000097: { name: "Apprentice Warden", category: "LABORATORY" },
  4000109: { name: "Super Troop", category: "LABORATORY" },
  4000110: { name: "Root Rider", category: "LABORATORY" },
  4000123: { name: "Druid", category: "LABORATORY" },
  4000132: { name: "Thrower", category: "LABORATORY" },
  4000150: { name: "Furnace", category: "LABORATORY" },
  4000177: { name: "New Troop", category: "LABORATORY" },

  // --- Siege Machines ---
  4000051: { name: "Wall Wrecker", category: "LABORATORY" },
  4000052: { name: "Battle Blimp", category: "LABORATORY" },
  4000062: { name: "Stone Slammer", category: "LABORATORY" },
  4000075: { name: "Siege Barracks", category: "LABORATORY" },
  4000087: { name: "Log Launcher", category: "LABORATORY" },
  4000091: { name: "Flame Flinger", category: "LABORATORY" },
  4000092: { name: "Battle Drill", category: "LABORATORY" },
  4000135: { name: "Troop Launcher", category: "LABORATORY" },

  // --- Spells ---
  26000000: { name: "Lightning Spell", category: "LABORATORY" },
  26000001: { name: "Healing Spell", category: "LABORATORY" },
  26000002: { name: "Rage Spell", category: "LABORATORY" },
  26000003: { name: "Jump Spell", category: "LABORATORY" },
  26000005: { name: "Freeze Spell", category: "LABORATORY" },
  26000009: { name: "Poison Spell", category: "LABORATORY" },
  26000010: { name: "Earthquake Spell", category: "LABORATORY" },
  26000011: { name: "Haste Spell", category: "LABORATORY" },
  26000016: { name: "Clone Spell", category: "LABORATORY" },
  26000017: { name: "Skeleton Spell", category: "LABORATORY" },
  26000028: { name: "Bat Spell", category: "LABORATORY" },
  26000035: { name: "Invisibility Spell", category: "LABORATORY" },
  26000053: { name: "Recall Spell", category: "LABORATORY" },
  26000070: { name: "Overgrowth Spell", category: "LABORATORY" },
  26000098: { name: "Revive Spell", category: "LABORATORY" },
  26000109: { name: "Ice Block Spell", category: "LABORATORY" },
  26000120: { name: "Endless Haste", category: "LABORATORY" },
  26000123: { name: "Dark Spell", category: "LABORATORY" },

  // --- Builder Base Buildings (buildings2) ---
  1000043: { name: "Hidden Tesla (BB)", category: "BUILDER_BASE" },
  1000078: { name: "O.T.T.O's Outpost", category: "BUILDER_BASE" },
  1000033: { name: "Wall (BB)", category: "BUILDER_BASE" },
  1000034: { name: "Builder Hall", category: "BUILDER_BASE" },
  1000035: { name: "Cannon (BB)", category: "BUILDER_BASE" },
  1000036: { name: "Archer Tower (BB)", category: "BUILDER_BASE" },
  1000037: { name: "Double Cannon", category: "BUILDER_BASE" },
  1000038: { name: "Air Defense (BB)", category: "BUILDER_BASE" },
  1000039: { name: "Multi Mortar", category: "BUILDER_BASE" },
  1000040: { name: "Roaster", category: "BUILDER_BASE" },
  1000041: { name: "Crusher", category: "BUILDER_BASE" },
  1000042: { name: "Push Trap", category: "BUILDER_BASE" },
  1000044: { name: "Giant Cannon", category: "BUILDER_BASE" },
  1000045: { name: "Mega Tesla", category: "BUILDER_BASE" },
  1000046: { name: "Lava Launcher", category: "BUILDER_BASE" },
  1000047: { name: "Elixir Collector (BB)", category: "BUILDER_BASE" },
  1000048: { name: "Elixir Storage (BB)", category: "BUILDER_BASE" },
  1000049: { name: "Gold Mine (BB)", category: "BUILDER_BASE" },
  1000050: { name: "Gold Storage (BB)", category: "BUILDER_BASE" },
  1000051: { name: "Builder Barracks", category: "BUILDER_BASE" },
  1000052: { name: "Star Laboratory", category: "BUILDER_BASE" },
  1000054: { name: "Clock Tower", category: "BUILDER_BASE" },
  1000056: { name: "Gem Mine", category: "BUILDER_BASE" },
  1000057: { name: "Battle Machine Altar", category: "BUILDER_BASE" },
  1000080: { name: "X-Bow (BB)", category: "BUILDER_BASE" },
  1000081: { name: "Healing Hut", category: "BUILDER_BASE" },

  // --- Builder Base Troops (units2) ---
  4000031: { name: "Raged Barbarian", category: "BUILDER_BASE" },
  4000032: { name: "Sneaky Archer", category: "BUILDER_BASE" },
  4000033: { name: "Boxer Giant", category: "BUILDER_BASE" },
  4000034: { name: "Beta Minion", category: "BUILDER_BASE" },
  4000035: { name: "Bomber", category: "BUILDER_BASE" },
  4000036: { name: "Baby Dragon (BB)", category: "BUILDER_BASE" },
  4000037: { name: "Cannon Cart", category: "BUILDER_BASE" },
  4000038: { name: "Night Witch", category: "BUILDER_BASE" },
  4000041: { name: "Drop Ship", category: "BUILDER_BASE" },
  4000042: { name: "Power P.E.K.K.A", category: "BUILDER_BASE" },
  4000070: { name: "Hog Glider", category: "BUILDER_BASE" },
  4000106: { name: "Electrofire Wizard", category: "BUILDER_BASE" },
};

/**
 * Resolves entity name and category from numeric ID or fallback heuristics.
 */
export function resolveEntity(
  dataId: number,
  fallbackName?: string,
  sectionHint?: string
): EntityInfo {
  if (CLASH_ENTITIES[dataId]) {
    return CLASH_ENTITIES[dataId];
  }

  const isBuilderBase = sectionHint?.endsWith("2");

  if (sectionHint === "heroes" || sectionHint === "heroes2") {
    return {
      name: fallbackName || `Hero (#${dataId})`,
      category: isBuilderBase ? "BUILDER_BASE" : "BUILDER",
    };
  }

  if (sectionHint === "pets") {
    return {
      name: fallbackName || `Pet (#${dataId})`,
      category: "PET_HOUSE",
    };
  }

  if (sectionHint === "spells" || sectionHint === "units" || sectionHint === "siege_machines") {
    return {
      name: fallbackName || `Research (#${dataId})`,
      category: "LABORATORY",
    };
  }

  if (sectionHint === "units2") {
    return {
      name: fallbackName || `Star Lab Research (#${dataId})`,
      category: "BUILDER_BASE",
    };
  }

  return {
    name: fallbackName || `Structure (#${dataId})`,
    category: isBuilderBase ? "BUILDER_BASE" : "BUILDER",
  };
}
