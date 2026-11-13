import { CheckCircle2, Clock, Zap } from "lucide-react";
import type { ActiveUpgrade, ParseResult } from "@/lib/types";
import { Badge, IconChip } from "@/app/_components/ui/badge";
import { Card, CardHeader } from "@/app/_components/ui/card";
import { CategoryBadge } from "@/app/_components/ui/category";

export function UpgradeResults({ result }: { result: ParseResult }) {
  return (
    <section className="space-y-4 animate-fade-in">
      <SummaryHeader result={result} />

      {result.upgrades.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader
            className="px-4 sm:px-5 py-3.5 border-b-2 border-black/40"
            icon={
              <IconChip tone="green" size="sm">
                <CheckCircle2 />
              </IconChip>
            }
            title={<>Active Upgrades ({result.totalActiveUpgrades})</>}
            actions={<span className="label-caps text-[0.7rem]">Sorted by finish time</span>}
          />

          <ol className="divide-y-2 divide-black/25">
            {result.upgrades.map((item, idx) => (
              <UpgradeRow key={item.id} item={item} position={idx + 1} />
            ))}
          </ol>
        </Card>
      ) : (
        <Card className="p-8 text-center space-y-2">
          <p className="font-display text-lg text-cream">
            No active upgrades found in this village snapshot.
          </p>
          <p className="text-sm text-muted">
            All builders, laboratory research, and pet houses appear to be idle.
          </p>
        </Card>
      )}
    </section>
  );
}

function SummaryHeader({ result }: { result: ParseResult }) {
  return (
    <Card className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 p-4 sm:p-5">
      <div className="space-y-1 min-w-0">
        <p className="label-caps text-[0.7rem]">
          Player Tag
        </p>
        <p className="heading-outline is-gold text-base truncate">
          {result.playerTag || "N/A"}
        </p>
      </div>

      <div className="space-y-1 min-w-0">
        <p className="label-caps text-[0.7rem]">
          Export Snapshot
        </p>
        <p className="text-sm font-bold text-cream tabular-nums">
          {result.formattedExportTime || "Just now"}
        </p>
      </div>

      <div className="space-y-1 min-w-0">
        <p className="label-caps text-[0.7rem]">
          Home Village
        </p>
        <p className="text-sm font-extrabold text-gold-300 tabular-nums">
          {result.builderUpgradesCount} Builders · {result.labUpgradesCount} Lab · {result.petUpgradesCount} Pet
        </p>
      </div>

      <div className="space-y-1 min-w-0">
        <p className="label-caps text-[0.7rem]">
          Builder Base
        </p>
        <p className="text-sm font-extrabold text-sky tabular-nums">
          {result.builderBaseUpgradesCount} Active
        </p>
      </div>
    </Card>
  );
}

function UpgradeRow({ item, position }: { item: ActiveUpgrade; position: number }) {
  return (
    <li className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:bg-white/[0.03]">
      <div className="flex items-start gap-3 min-w-0">
        <div className="well w-8 h-8 shrink-0 flex items-center justify-center font-display text-sm text-gold-300 tabular-nums">
          {position}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-cream">
              {item.name}
            </h3>
            <CategoryBadge category={item.category} />
            {item.isGoblinOrHelper && (
              <Badge tone="green" icon={<Zap className="w-3 h-3" />}>
                Extra Slot / Goblin
              </Badge>
            )}
          </div>
          <p className="text-xs font-semibold text-muted mt-1 tabular-nums">
            Level: {item.currentLevel} →{" "}
            <span className="text-gold-300 font-extrabold">
              Level {item.targetLevel}
            </span>
          </p>
        </div>
      </div>

      <div className="pl-11 sm:pl-0 shrink-0 flex flex-wrap items-center gap-x-2.5 gap-y-1 sm:block sm:text-right sm:space-y-1">
        <div className="well inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gold-300">
          <Clock className="w-3.5 h-3.5" />
          <span className="timer">{item.formattedRemaining}</span>
        </div>
        <p className="text-[11px] font-semibold text-faint tabular-nums">
          Finishes: {item.formattedFinishTime}
        </p>
      </div>
    </li>
  );
}
