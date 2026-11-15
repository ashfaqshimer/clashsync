"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { formatDuration } from "@/lib/parser";
import { tagToSlug } from "@/lib/tags";
import type { OwnedVillage } from "@/lib/village";
import { formatAge, villageStatus, type VillageStatus } from "@/lib/village-status";
import { useNow } from "@/app/v/[tag]/use-now";
import { Badge, IconChip } from "@/app/_components/ui/badge";
import { Card } from "@/app/_components/ui/card";

/**
 * Village list rows. Idle builders and stale exports depend on the client
 * clock, so this is a client component; the server order (newest sync first)
 * is used until the clock is known.
 */
export function VillageRows({ villages }: { villages: OwnedVillage[] }) {
  const now = useNow();
  // Villages that need something go first. The order is fixed on the first tick
  // so rows don't jump around under the cursor as timers finish.
  const [order, setOrder] = useState<string[] | null>(null);
  if (now !== null && order === null) {
    const attention = (v: OwnedVillage) => (villageStatus(v, now).needsAttention ? 0 : 1);
    setOrder([...villages].sort((a, b) => attention(a) - attention(b)).map((v) => v.playerTag));
  }
  const sorted = order
    ? [...villages].sort((a, b) => order.indexOf(a.playerTag) - order.indexOf(b.playerTag))
    : villages;

  return (
    <Card as="ul" className="divide-y-2 divide-black/30 overflow-hidden">
      {sorted.map((v) => (
        <li key={v.playerTag}>
          <VillageRow village={v} status={now === null ? null : villageStatus(v, now)} now={now} />
        </li>
      ))}
    </Card>
  );
}

function VillageRow({
  village: v,
  status,
  now,
}: {
  village: OwnedVillage;
  status: VillageStatus | null;
  now: number | null;
}) {
  return (
    <Link
      href={`/v/${tagToSlug(v.playerTag)}`}
      className="group flex items-center gap-3 p-4 transition hover:bg-white/[0.04] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-sky"
    >
      <IconChip>
        {v.townHallLevel ? <span className="font-display text-base leading-none">{v.townHallLevel}</span> : <Hammer />}
      </IconChip>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="flex items-baseline gap-2 min-w-0">
          <span className="heading-outline is-gold text-lg truncate">{v.playerName ?? v.playerTag}</span>
          {v.playerName && (
            <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">
              {v.townHallLevel ? `TH${v.townHallLevel} · ` : ""}
              {v.playerTag}
            </span>
          )}
          {!v.playerName && v.townHallLevel && <span className="sr-only">Town Hall {v.townHallLevel}</span>}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-h-5 text-xs font-semibold text-muted tabular-nums">
          {status && <StatusBadge status={status} />}
          {status && now !== null && status.nextFinishTime !== null && (
            <span>next done in {formatDuration(status.nextFinishTime - now)}</span>
          )}
          {status?.exportAge != null && (
            <span className={status.stale ? "text-gold-300" : undefined}>
              {status.stale ? "export is " : "synced "}
              {formatAge(status.exportAge).replace(" ago", status.stale ? " old" : " ago")}
            </span>
          )}
        </div>
      </div>
      <ArrowRight className="w-5 h-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-gold-300" />
    </Link>
  );
}

function StatusBadge({ status }: { status: VillageStatus }) {
  if (status.running === 0) return <Badge tone="red">Nothing upgrading</Badge>;
  if (status.idleBuilders !== null && status.idleBuilders > 0) {
    return (
      <Badge tone="red">
        {status.idleBuilders} builder{status.idleBuilders === 1 ? "" : "s"} idle
      </Badge>
    );
  }
  if (status.idleBuilders === 0) return <Badge tone="green">All builders busy</Badge>;
  return (
    <Badge tone="stone">
      {status.running} upgrade{status.running === 1 ? "" : "s"} running
    </Badge>
  );
}
