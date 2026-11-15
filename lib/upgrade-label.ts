/**
 * Display name for an upgrade. The DB and parser keep the plain entity name;
 * the gear-up / extra-slot labels are added only for display. Pure and client-safe.
 */
export function upgradeLabel(u: { name: string; isGearUp?: boolean; isExtraSlot?: boolean }): string {
  let label = u.name;
  if (u.isGearUp) label += " (Gear-Up)";
  if (u.isExtraSlot) label += " (Goblin/Extra)";
  return label;
}
