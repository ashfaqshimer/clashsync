import { UpgradeType } from "./types";

export interface EntityInfo {
  name: string;
  category: UpgradeType;
}

// Known Clash of Clans item ID mappings from game files
export const CLASH_ENTITIES: Record<number, EntityInfo> = {
  // --- Core Buildings & Defenses ---
  1000000: { name: "Town Hall", category: "BUILDER" },
  1000001: { name: "Cannon", category: "BUILDER" },
  1000002: { name: "Archer Tower", category: "BUILDER" },
  1000003: { name: "Wall", category: "BUILDER" },
  1000004: { name: "Mortar", category: "BUILDER" },
  1000005: { name: "Air Defense", category: "BUILDER" },
  1000006: { name: "Wizard Tower", category: "BUILDER" },
  1000007: { name: "Air Sweeper", category: "BUILDER" },
  1000008: { name: "Hidden Tesla", category: "BUILDER" },
  1000009: { name: "Bomb Tower", category: "BUILDER" },
  1000010: { name: "X-Bow", category: "BUILDER" },
  1000011: { name: "Inferno Tower", category: "BUILDER" },
  1000012: { name: "Eagle Artillery", category: "BUILDER" },
  1000013: { name: "Scattershot", category: "BUILDER" },
  1000014: { name: "Builder's Hut", category: "BUILDER" },
  1000015: { name: "Clan Castle", category: "BUILDER" },
  1000030: { name: "Monolith", category: "BUILDER" },
  1000031: { name: "Spell Tower", category: "BUILDER" },
  1000032: { name: "Multi-Archer Tower", category: "BUILDER" },
  1000033: { name: "Ricochet Cannon", category: "BUILDER" },
  1000034: { name: "Super Wizard Tower", category: "BUILDER" },
  1000035: { name: "Multi-Inferno Tower", category: "BUILDER" },

  // --- Resource & Army Infrastructure ---
  1000016: { name: "Gold Mine", category: "BUILDER" },
  1000017: { name: "Elixir Collector", category: "BUILDER" },
  1000018: { name: "Gold Storage", category: "BUILDER" },
  1000019: { name: "Elixir Storage", category: "BUILDER" },
  1000020: { name: "Dark Elixir Drill", category: "BUILDER" },
  1000021: { name: "Dark Elixir Storage", category: "BUILDER" },
  1000022: { name: "Army Camp", category: "BUILDER" },
  1000023: { name: "Barracks", category: "BUILDER" },
  1000024: { name: "Laboratory", category: "BUILDER" },
  1000025: { name: "Spell Factory", category: "BUILDER" },
  1000026: { name: "Dark Barracks", category: "BUILDER" },
  1000027: { name: "Dark Spell Factory", category: "BUILDER" },
  1000028: { name: "Workshop", category: "BUILDER" },
  1000029: { name: "Pet House", category: "BUILDER" },
  1000036: { name: "Blacksmith", category: "BUILDER" },

  // --- Traps ---
  1000050: { name: "Bomb", category: "BUILDER" },
  1000051: { name: "Spring Trap", category: "BUILDER" },
  1000052: { name: "Air Bomb", category: "BUILDER" },
  1000053: { name: "Giant Bomb", category: "BUILDER" },
  1000054: { name: "Seeking Air Mine", category: "BUILDER" },
  1000055: { name: "Skeleton Trap", category: "BUILDER" },
  1000056: { name: "Tornado Trap", category: "BUILDER" },

  // --- Heroes ---
  28000000: { name: "Barbarian King", category: "BUILDER" },
  28000001: { name: "Archer Queen", category: "BUILDER" },
  28000002: { name: "Grand Warden", category: "BUILDER" },
  28000003: { name: "Royal Champion", category: "BUILDER" },
  28000004: { name: "Minion Prince", category: "BUILDER" },

  // --- Pets (Pet House) ---
  71000000: { name: "L.A.S.S.I", category: "PET_HOUSE" },
  71000001: { name: "Electro Owl", category: "PET_HOUSE" },
  71000002: { name: "Mighty Yak", category: "PET_HOUSE" },
  71000003: { name: "Unicorn", category: "PET_HOUSE" },
  71000004: { name: "Frosty", category: "PET_HOUSE" },
  71000005: { name: "Diggy", category: "PET_HOUSE" },
  71000006: { name: "Poison Lizard", category: "PET_HOUSE" },
  71000007: { name: "Phoenix", category: "PET_HOUSE" },
  71000008: { name: "Spirit Fox", category: "PET_HOUSE" },
  71000009: { name: "Angry Jelly", category: "PET_HOUSE" },

  // --- Common Laboratory Troops & Spells ---
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
  4000014: { name: "Witch", category: "LABORATORY" },
  4000015: { name: "Lava Hound", category: "LABORATORY" },
  4000016: { name: "Bowler", category: "LABORATORY" },
  4000017: { name: "Baby Dragon", category: "LABORATORY" },
  4000018: { name: "Miner", category: "LABORATORY" },
  4000019: { name: "Electro Dragon", category: "LABORATORY" },
  4000020: { name: "Yeti", category: "LABORATORY" },
  4000021: { name: "Dragon Rider", category: "LABORATORY" },
  4000022: { name: "Electro Titan", category: "LABORATORY" },
  4000023: { name: "Root Rider", category: "LABORATORY" },
  4000024: { name: "Thrower", category: "LABORATORY" },

  // Spells
  26000000: { name: "Lightning Spell", category: "LABORATORY" },
  26000001: { name: "Healing Spell", category: "LABORATORY" },
  26000002: { name: "Rage Spell", category: "LABORATORY" },
  26000003: { name: "Jump Spell", category: "LABORATORY" },
  26000004: { name: "Freeze Spell", category: "LABORATORY" },
  26000005: { name: "Clone Spell", category: "LABORATORY" },
  26000006: { name: "Invisibility Spell", category: "LABORATORY" },
  26000007: { name: "Recall Spell", category: "LABORATORY" },
  26000008: { name: "Overgrowth Spell", category: "LABORATORY" },
  26000009: { name: "Revive Spell", category: "LABORATORY" },
  26000010: { name: "Poison Spell", category: "LABORATORY" },
  26000011: { name: "Earthquake Spell", category: "LABORATORY" },
  26000012: { name: "Haste Spell", category: "LABORATORY" },
  26000013: { name: "Skeleton Spell", category: "LABORATORY" },
  26000014: { name: "Bat Spell", category: "LABORATORY" },
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

  // Fallback heuristics based on ID ranges or section
  if (sectionHint === "heroes") {
    return {
      name: fallbackName || `Hero (#${dataId})`,
      category: "BUILDER",
    };
  }

  if (sectionHint === "pets") {
    return {
      name: fallbackName || `Pet (#${dataId})`,
      category: "PET_HOUSE",
    };
  }

  if (sectionHint === "spells" || sectionHint === "units") {
    return {
      name: fallbackName || `Research (#${dataId})`,
      category: "LABORATORY",
    };
  }

  return {
    name: fallbackName || `Structure (#${dataId})`,
    category: "BUILDER",
  };
}
