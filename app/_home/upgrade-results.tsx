import { CheckCircle2, Clock, FlaskConical, Hammer, PawPrint, Wrench, Zap } from "lucide-react";
import type { ActiveUpgrade, ParseResult } from "@/lib/types";

export function UpgradeResults({ result }: { result: ParseResult }) {
  return (
    <section className="space-y-4">
      <SummaryHeader result={result} />

      {result.upgrades.length > 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Active Upgrades ({result.totalActiveUpgrades})</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Sorted by finish time
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {result.upgrades.map((item, idx) => (
              <UpgradeRow key={item.id} item={item} position={idx + 1} />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-900/30 space-y-2">
          <p className="text-sm font-medium text-slate-300">
            No active upgrades found in this village snapshot.
          </p>
          <p className="text-xs text-slate-500">
            All builders, laboratory research, and pet houses appear to be idle.
          </p>
        </div>
      )}
    </section>
  );
}

function SummaryHeader({ result }: { result: ParseResult }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="space-y-0.5">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
          Player Tag
        </p>
        <p className="text-sm font-bold text-white font-mono">
          {result.playerTag || "N/A"}
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
          Export Snapshot
        </p>
        <p className="text-sm font-semibold text-slate-300">
          {result.formattedExportTime || "Just now"}
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
          Home Village
        </p>
        <p className="text-sm font-bold text-amber-400">
          {result.builderUpgradesCount} Builders · {result.labUpgradesCount} Lab · {result.petUpgradesCount} Pet
        </p>
      </div>

      <div className="space-y-0.5">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
          Builder Base
        </p>
        <p className="text-sm font-bold text-sky-400">
          {result.builderBaseUpgradesCount} Active
        </p>
      </div>
    </div>
  );
}

function UpgradeRow({ item, position }: { item: ActiveUpgrade; position: number }) {
  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/50 transition">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 mt-0.5">
          {position}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">
              {item.name}
            </h3>
            <CategoryBadge category={item.category} />
            {item.isGoblinOrHelper && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-2.5 h-2.5" />
                Extra Slot / Goblin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Level: {item.currentLevel} →{" "}
            <span className="text-amber-400 font-semibold">
              Level {item.targetLevel}
            </span>
          </p>
        </div>
      </div>

      <div className="sm:text-right pl-10 sm:pl-0 space-y-0.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>{item.formattedRemaining}</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Finishes: {item.formattedFinishTime}
        </p>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  switch (category) {
    case "BUILDER":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Hammer className="w-3 h-3" />
          Builder
        </span>
      );
    case "LABORATORY":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
          <FlaskConical className="w-3 h-3" />
          Laboratory
        </span>
      );
    case "PET_HOUSE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <PawPrint className="w-3 h-3" />
          Pet House
        </span>
      );
    case "BUILDER_BASE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Wrench className="w-3 h-3" />
          Builder Base
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          Upgrade
        </span>
      );
  }
}
