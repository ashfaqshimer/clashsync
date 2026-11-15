export const UPGRADE_TYPES = ["BUILDER", "LABORATORY", "PET_HOUSE", "BUILDER_BASE", "OTHER"] as const;
export type UpgradeType = (typeof UPGRADE_TYPES)[number];

export const VILLAGE_TYPES = ["HOME", "BUILDER_BASE"] as const;
export type VillageType = (typeof VILLAGE_TYPES)[number];

export interface RawVillageItem {
  data?: number;
  id?: number | string;
  name?: string;
  lvl?: number;
  level?: number;
  timer?: number; // Remaining seconds until completion
  cnt?: number;
  gear_up?: number;
  extra?: boolean; // Goblin builder / apprentice / secondary slot
  [key: string]: unknown;
}

export interface RawExportVillage {
  tag?: string;
  timestamp?: number; // Unix epoch timestamp (seconds)
  buildings?: RawVillageItem[];
  heroes?: RawVillageItem[];
  units?: RawVillageItem[];
  spells?: RawVillageItem[];
  siege_machines?: RawVillageItem[];
  pets?: RawVillageItem[];
  traps?: RawVillageItem[];
  buildings2?: RawVillageItem[];
  heroes2?: RawVillageItem[];
  units2?: RawVillageItem[];
  traps2?: RawVillageItem[];
  helpers?: RawVillageItem[];
  boosts?: Record<string, number>;
  [key: string]: unknown;
}

export interface ActiveUpgrade {
  id: string;
  dataId: number;
  name: string;
  category: UpgradeType;
  villageType: VillageType;
  currentLevel: number;
  targetLevel: number;
  remainingSeconds: number;
  originalFinishTime: number; // Unix epoch (seconds)
  currentFinishTime: number; // Unix epoch (seconds)
  formattedRemaining: string;
  formattedFinishTime: string;
  isGearUp?: boolean;
  isGoblinOrHelper?: boolean;
}

export interface ParseResult {
  success: boolean;
  playerTag?: string;
  exportTimestamp?: number;
  formattedExportTime?: string;
  totalActiveUpgrades: number;
  builderUpgradesCount: number;
  labUpgradesCount: number;
  petUpgradesCount: number;
  builderBaseUpgradesCount: number;
  builderHutCount?: number; // Home village Builder's Huts, if the export lists them
  builderBoostEndsAt?: number; // Unix seconds, when a builder potion was running at export
  upgrades: ActiveUpgrade[];
  error?: string;
}
