"use client";

import { formatDuration } from "@/lib/parser";
import { useNow } from "@/app/v/[tag]/use-now";

/** Relative times need the client clock (the server never computes "now"). */
export function VillageTimes({
  activeUpgrades,
  nextFinishTime,
  lastExportTimestamp,
}: {
  activeUpgrades: number;
  nextFinishTime: number | null;
  lastExportTimestamp: number | null;
}) {
  const now = useNow();
  const parts = [`${activeUpgrades} upgrade${activeUpgrades === 1 ? "" : "s"} running`];
  if (now !== null && nextFinishTime !== null && nextFinishTime > now) {
    parts.push(`next done in ${formatDuration(nextFinishTime - now)}`);
  }
  if (now !== null && lastExportTimestamp !== null) {
    const age = now - lastExportTimestamp;
    parts.push(`synced ${age < 60 ? "just now" : `${formatDuration(age)} ago`}`);
  }
  return <p className="text-xs font-semibold text-muted mt-1 min-h-4 tabular-nums">{parts.join(" · ")}</p>;
}
