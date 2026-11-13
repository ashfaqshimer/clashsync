"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FlaskConical,
  Hammer,
  PawPrint,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { formatDuration } from "@/lib/parser";
import type { VillageSnapshot, VillageUpgrade } from "@/lib/village";
import { OwnershipCard } from "./ownership-card";
import { PotionBar } from "./potion-bar";
import { useNow } from "./use-now";

/** Exports older than this probably miss upgrades started since. */
const STALE_AFTER_SECONDS = 12 * 3600;

type GroupKey = "builders" | "lab" | "pets" | "builderBase" | "other";

const GROUPS: Record<
  GroupKey,
  { label: string; Icon: ComponentType<{ className?: string }>; accent: string }
> = {
  builders: { label: "Builders", Icon: Hammer, accent: "text-amber-400" },
  lab: { label: "Laboratory", Icon: FlaskConical, accent: "text-fuchsia-400" },
  pets: { label: "Pet House", Icon: PawPrint, accent: "text-emerald-400" },
  builderBase: { label: "Builder Base", Icon: Wrench, accent: "text-sky-400" },
  other: { label: "Other", Icon: Clock, accent: "text-slate-400" },
};

function groupOf(u: VillageUpgrade): GroupKey {
  if (u.villageType === "BUILDER_BASE" || u.category === "BUILDER_BASE") return "builderBase";
  if (u.category === "BUILDER") return "builders";
  if (u.category === "LABORATORY") return "lab";
  if (u.category === "PET_HOUSE") return "pets";
  return "other";
}

function formatClock(epochSeconds: number) {
  return new Date(epochSeconds * 1000).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LiveDashboard({
  village,
  isOwner,
  canEdit,
}: {
  village: VillageSnapshot;
  isOwner: boolean;
  canEdit: boolean;
}) {
  const now = useNow();

  const grouped = new Map<GroupKey, VillageUpgrade[]>();
  for (const u of village.upgrades) {
    const key = groupOf(u);
    grouped.set(key, [...(grouped.get(key) ?? []), u]);
  }

  const isRunning = (u: VillageUpgrade) => now === null || u.currentFinishTime > now;
  // Goblin builder / goblin researcher slots don't occupy a regular builder or lab
  const mainSlot = (key: GroupKey) => (grouped.get(key) ?? []).filter((u) => !u.isExtraSlot);

  const busyBuilders = mainSlot("builders").filter(isRunning);
  const nextBuilderFree = busyBuilders[0]?.currentFinishTime;
  const idleBuilders =
    village.builderCount !== null
      ? Math.max(0, village.builderCount - busyBuilders.length)
      : null;

  const labBusy = mainSlot("lab").filter(isRunning);
  const petsBusy = mainSlot("pets").filter(isRunning);
  const bbBusy = mainSlot("builderBase").filter(isRunning);

  const exportAge =
    now !== null && village.lastExportTimestamp !== null
      ? now - village.lastExportTimestamp
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{village.playerTag}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {exportAge === null
              ? " "
              : `Synced ${exportAge < 60 ? "just now" : `${formatDuration(exportAge)} ago`}`}
          </p>
        </div>
      </div>

      {exportAge !== null && exportAge > STALE_AFTER_SECONDS && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
          <TriangleAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            Your export is {formatDuration(exportAge)} old, so upgrades you&apos;ve started since
            won&apos;t show here.{" "}
            <Link href="/" className="font-semibold underline underline-offset-2 hover:text-white">
              Re-sync for accuracy
            </Link>
          </div>
        </div>
      )}

      {/* Status tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusTile
          group="builders"
          headline={
            idleBuilders !== null
              ? `${busyBuilders.length}/${village.builderCount} busy`
              : `${busyBuilders.length} busy`
          }
          detail={
            idleBuilders !== null && idleBuilders > 0
              ? `${idleBuilders} builder${idleBuilders === 1 ? "" : "s"} idle!`
              : nextBuilderFree && now !== null
                ? `Next free in ${formatDuration(nextBuilderFree - now)}`
                : busyBuilders.length === 0
                  ? "All builders free"
                  : null
          }
          alert={(idleBuilders ?? 0) > 0 || (busyBuilders.length === 0 && now !== null)}
        />
        <SlotTile group="lab" busy={labBusy} now={now} idleText="Lab is idle!" />
        <SlotTile group="pets" busy={petsBusy} now={now} idleText="Pet House is idle" />
        <SlotTile group="builderBase" busy={bbBusy} now={now} idleText="Nothing upgrading" />
      </div>

      <PotionBar village={village} now={now} canEdit={canEdit} />

      {/* Upgrade lists */}
      {village.upgrades.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          No upgrades were running in your last export.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {(Object.keys(GROUPS) as GroupKey[])
            .filter((key) => grouped.has(key))
            .map((key) => (
              <UpgradeGroup key={key} group={key} items={grouped.get(key)!} now={now} />
            ))}
        </div>
      )}

      <OwnershipCard tag={village.playerTag} isOwner={isOwner} isVerified={village.isVerified} />
    </div>
  );
}

function StatusTile({
  group,
  headline,
  detail,
  alert,
}: {
  group: GroupKey;
  headline: string;
  detail: string | null;
  alert: boolean;
}) {
  const { label, Icon, accent } = GROUPS[group];
  return (
    <div
      className={`rounded-xl border p-4 ${
        alert ? "border-amber-500/40 bg-amber-500/5" : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-white">{headline}</div>
      <div className={`text-xs mt-0.5 min-h-4 ${alert ? "text-amber-300" : "text-slate-400"}`}>
        {detail ?? " "}
      </div>
    </div>
  );
}

function SlotTile({
  group,
  busy,
  now,
  idleText,
}: {
  group: GroupKey;
  busy: VillageUpgrade[];
  now: number | null;
  idleText: string;
}) {
  const next = busy[0];
  return (
    <StatusTile
      group={group}
      headline={busy.length > 0 ? "Busy" : "Idle"}
      detail={
        now === null
          ? null
          : next
            ? `Free in ${formatDuration(next.currentFinishTime - now)}`
            : idleText
      }
      alert={now !== null && busy.length === 0 && group !== "builderBase"}
    />
  );
}

function UpgradeGroup({
  group,
  items,
  now,
}: {
  group: GroupKey;
  items: VillageUpgrade[];
  now: number | null;
}) {
  const { label, Icon, accent } = GROUPS[group];
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <Icon className={`w-4 h-4 ${accent}`} />
        {label}
        <span className="text-slate-500 font-normal">({items.length})</span>
      </h2>
      <ul className="divide-y divide-slate-800/80">
        {items.map((u) => {
          const remaining = now === null ? null : u.currentFinishTime - now;
          const done = remaining !== null && remaining <= 0;
          return (
            <li key={u.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-100 truncate">{u.name}</div>
                <div className="text-[11px] text-slate-500">
                  Lv {u.currentLevel} → {u.targetLevel}
                  {now !== null && <> · {formatClock(u.currentFinishTime)}</>}
                </div>
              </div>
              <div className="text-right shrink-0">
                {done ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Done
                  </span>
                ) : (
                  <span className="font-mono text-sm tabular-nums text-amber-300">
                    {remaining === null ? "--" : formatDuration(remaining)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
