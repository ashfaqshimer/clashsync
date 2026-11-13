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
import { formatDuration } from "@/lib/parser";
import type { VillageSnapshot, VillageUpgrade } from "@/lib/village";
import { AlertsCard } from "./alerts-card";
import { OwnershipCard, type OwnershipView } from "./ownership-card";
import { PotionBar } from "./potion-bar";
import { useNow } from "./use-now";
import type { LucideIcon } from "lucide-react";
import { Badge, IconChip, type Tone } from "@/app/_components/ui/badge";
import { Card, CardHeader, Heading, Well } from "@/app/_components/ui/card";
import { StatusTile as Tile } from "@/app/_components/ui/status-tile";

/** Exports older than this probably miss upgrades started since. */
const STALE_AFTER_SECONDS = 12 * 3600;

type GroupKey = "builders" | "lab" | "pets" | "builderBase" | "other";

const GROUPS: Record<GroupKey, { label: string; Icon: LucideIcon; tone: Tone }> = {
  builders: { label: "Builders", Icon: Hammer, tone: "gold" },
  lab: { label: "Laboratory", Icon: FlaskConical, tone: "elixir" },
  pets: { label: "Pet House", Icon: PawPrint, tone: "green" },
  builderBase: { label: "Builder Base", Icon: Wrench, tone: "sky" },
  other: { label: "Other", Icon: Clock, tone: "stone" },
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
  ownership,
}: {
  village: VillageSnapshot;
  isOwner: boolean;
  canEdit: boolean;
  ownership: OwnershipView;
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
      <Card tone="wood" className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
        <IconChip size="lg">
          <Hammer />
        </IconChip>
        <div className="min-w-0">
          <Heading as="h1" size="lg" gold className="truncate">
            {village.playerTag}
          </Heading>
          <p className="text-sm font-semibold text-cream/80 mt-1 min-h-5 tabular-nums">
            {exportAge === null
              ? " "
              : `Synced ${exportAge < 60 ? "just now" : `${formatDuration(exportAge)} ago`}`}
          </p>
        </div>
      </Card>

      {exportAge !== null && exportAge > STALE_AFTER_SECONDS && (
        <div role="status" className="panel-stone !border-gold-500 flex items-start gap-3 p-4 text-sm font-semibold text-gold-100 animate-fade-in">
          <IconChip size="sm">
            <TriangleAlert />
          </IconChip>
          <div className="flex-1 self-center">
            Your export is {formatDuration(exportAge)} old, so upgrades you&apos;ve started since
            won&apos;t show here.{" "}
            <Link href="/" className="font-extrabold text-gold-300 underline decoration-2 underline-offset-2 hover:text-cream">
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
        <Card className="p-8 text-center font-display text-lg text-cream/85">
          No upgrades were running in your last export.
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {(Object.keys(GROUPS) as GroupKey[])
            .filter((key) => grouped.has(key))
            .map((key) => (
              <UpgradeGroup key={key} group={key} items={grouped.get(key)!} now={now} />
            ))}
        </div>
      )}

      {isOwner && (
        <AlertsCard
          tag={village.playerTag}
          webhookOn={village.webhookAlerts}
          dmOn={village.dmAlerts}
          leadMinutes={village.alertLeadMinutes}
          dmAvailable={ownership.dmAvailable}
        />
      )}

      <OwnershipCard tag={village.playerTag} ownership={ownership} />
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
  const { label, Icon, tone } = GROUPS[group];
  return <Tile icon={Icon} tone={tone} label={label} headline={headline} detail={detail} alert={alert} />;
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
  const { label, Icon, tone } = GROUPS[group];
  return (
    <Card className="p-4 sm:p-5 space-y-3">
      <CardHeader
        icon={
          <IconChip tone={tone} size="sm">
            <Icon />
          </IconChip>
        }
        title={label}
        count={items.length}
      />
      <Well as="ul" className="divide-y-2 divide-black/25">
        {items.map((u) => {
          const remaining = now === null ? null : u.currentFinishTime - now;
          const done = remaining !== null && remaining <= 0;
          return (
            <li key={u.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-cream truncate">{u.name}</div>
                <div className="text-[11px] font-semibold text-faint tabular-nums">
                  Lv {u.currentLevel} → {u.targetLevel}
                  {now !== null && <> · {formatClock(u.currentFinishTime)}</>}
                </div>
              </div>
              <div className="text-right shrink-0">
                {done ? (
                  <Badge tone="green" icon={<CheckCircle2 className="w-3 h-3" />}>
                    Done
                  </Badge>
                ) : (
                  <span className="timer text-sm text-gold-300">
                    {remaining === null ? "--" : formatDuration(remaining)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </Well>
    </Card>
  );
}
