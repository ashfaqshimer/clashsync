/**
 * Real Clash of Clans village export data fixture.
 * (Settings -> More Settings -> Data Export -> Copy)
 */
export const SAMPLE_VILLAGE_JSON = JSON.stringify(
  {
    tag: "#R8L9R2GVG",
    timestamp: Math.floor(Date.now() / 1000) - 180,
    helpers: [
      { data: 93000000, lvl: 8, helper_cooldown: 64477 },
      { data: 93000001, lvl: 12, helper_cooldown: 64477 },
      { data: 93000002, lvl: 1, helper_cooldown: 64477 },
      { data: 93000003, lvl: 1 },
    ],
    guardians: [
      { data: 107000000, lvl: 1 },
      { data: 107000001, lvl: 1 },
      { data: 107000008, lvl: 5 },
    ],
    buildings: [
      { data: 1000013, lvl: 8, gear_up: 1 },
      { data: 1000003, lvl: 17, timer: 156538, extra: true },
      { data: 1000084, lvl: 2, timer: 45144 },
      { data: 1000000, lvl: 14, cnt: 4 },
      { data: 1000001, lvl: 18, cnt: 1 },
      { data: 1000002, lvl: 4, cnt: 3 },
      { data: 1000005, lvl: 18, cnt: 1 },
      { data: 1000009, lvl: 13, cnt: 1 },
      { data: 1000010, lvl: 19, cnt: 325 },
      { data: 1000014, lvl: 14, cnt: 1 },
    ],
    traps: [
      { data: 12000000, lvl: 1, cnt: 5 },
      { data: 12000006, lvl: 3, cnt: 8 },
    ],
    units: [
      { data: 4000000, lvl: 13 },
      { data: 4000008, lvl: 13 },
      { data: 4000097, lvl: 1, timer: 4472, extra: true },
      { data: 4000123, lvl: 2, timer: 195130 },
    ],
    siege_machines: [
      { data: 4000051, lvl: 1 },
      { data: 4000075, lvl: 1 },
    ],
    heroes: [
      { data: 28000000, lvl: 77, timer: 29200 },
      { data: 28000001, lvl: 86, timer: 67787 },
      { data: 28000002, lvl: 66, timer: 179524 },
      { data: 28000004, lvl: 53, timer: 8100 },
      { data: 28000006, lvl: 71, timer: 22869 },
      { data: 28000007, lvl: 25 },
    ],
    spells: [
      { data: 26000000, lvl: 8 },
      { data: 26000002, lvl: 7 },
    ],
    pets: [
      { data: 73000000, lvl: 3 },
      { data: 73000001, lvl: 1 },
      { data: 73000002, lvl: 3 },
      { data: 73000003, lvl: 10, timer: 132537 },
      { data: 73000004, lvl: 10 },
      { data: 73000009, lvl: 15 },
    ],
    buildings2: [
      { data: 1000078, lvl: 3, timer: 89884 },
      { data: 1000043, lvl: 9, timer: 47964 },
      { data: 1000034, lvl: 10, cnt: 1 },
    ],
    units2: [
      { data: 4000031, lvl: 12 },
      { data: 4000035, lvl: 15, timer: 361880 },
    ],
    heroes2: [
      { data: 28000003, lvl: 30, timer: 57894 },
      { data: 28000005, lvl: 30 },
    ],
    boosts: {
      builder_boost: 3538,
      clocktower_cooldown: 27825,
    },
  },
  null,
  2
);
