/**
 * Realistic sample exported village JSON from Clash of Clans
 * (Settings -> More Settings -> Data Export -> Copy)
 */
export const SAMPLE_VILLAGE_JSON = JSON.stringify(
  {
    tag: "#9PR8Y2QL",
    timestamp: Math.floor(Date.now() / 1000) - 120, // Exported 2 minutes ago
    buildings: [
      { data: 1000000, lvl: 16 }, // Town Hall 16
      { data: 1000012, lvl: 6, timer: 125430 }, // Eagle Artillery upgrading to 7 (~1d 10h)
      { data: 1000013, lvl: 4, timer: 295000 }, // Scattershot upgrading to 5 (~3d 10h)
      { data: 1000030, lvl: 2, timer: 412000 }, // Monolith upgrading to 3 (~4d 18h)
      { data: 1000001, lvl: 21, gear_up: 1, timer: 48000 }, // Cannon Gear-Up (~13h)
      { data: 1000002, lvl: 21, cnt: 5 },
      { data: 1000010, lvl: 10, cnt: 4 },
      { data: 1000018, lvl: 16, cnt: 4 },
      { data: 1000019, lvl: 16, cnt: 4 },
    ],
    heroes: [
      { data: 28000001, lvl: 94, timer: 172800 }, // Archer Queen upgrading to 95 (2 days)
      { data: 28000000, lvl: 90 }, // Barbarian King (idle)
      { data: 28000002, lvl: 65 }, // Grand Warden (idle)
      { data: 28000003, lvl: 40 }, // Royal Champion (idle)
    ],
    units: [
      { data: 4000022, lvl: 3, timer: 118800 }, // Electro Titan upgrading to 4 (~1d 9h in Lab)
      { data: 4000008, lvl: 10 }, // Dragon
      { data: 4000005, lvl: 11 }, // Balloon
    ],
    pets: [
      { data: 71000005, lvl: 9, timer: 237600 }, // Diggy upgrading to 10 (~2d 18h in Pet House)
      { data: 71000008, lvl: 10 }, // Spirit Fox (max)
    ],
  },
  null,
  2
);
