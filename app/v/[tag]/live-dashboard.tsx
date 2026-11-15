"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { upgradeLabel } from "@/lib/upgrade-label";
import {
  CheckCircle2,
  Clock,
  FlaskConical,
  Hammer,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Hint } from "@/app/_components/ui/hint";
import { SetupChecklist } from "./setup-checklist";
import { UpdatePanel } from "./update-panel";
import { formatDuration } from "@/lib/parser";
import { formatAge, STALE_AFTER_SECONDS } from "@/lib/village-status";
import type { VillageSnapshot, VillageUpgrade } from "@/lib/village";
import { AlertsCard } from "./alerts-card";
import { OwnershipCard, type OwnershipView } from "./ownership-card";
import { PotionBar } from "./potion-bar";
import { TonightCard } from "./tonight-card";
import { useTabCountdown } from "./use-tab-countdown";
import { useNow } from "./use-now";
import type { LucideIcon } from "lucide-react";
import { Badge, IconChip, type Tone } from "@/app/_components/ui/badge";
import { Card, CardHeader, Heading, Well } from "@/app/_components/ui/card";
import { StatusTile as Tile } from "@/app/_components/ui/status-tile";


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
  demo = false,
  profile,
}: {
  village: VillageSnapshot;
  isOwner: boolean;
  canEdit: boolean;
  ownership: OwnershipView;
  /** Public demo (/demo): read-only, no alerts or ownership cards. */
  demo?: boolean;
  /** Player name / Town Hall line under the heading (streamed in by the server). */
  profile?: ReactNode;
}) {
  const now = useNow();
  const [updateOpen, setUpdateOpen] = useState(false);
  const canUpdate = canEdit && !demo;

  const grouped = new Map<GroupKey, VillageUpgrade[]>();
  for (const u of village.upgrades) {
    const key = groupOf(u);
    grouped.set(key, [...(grouped.get(key) ?? []), u]);
  }
  for (const items of grouped.values()) items.sort((a, b) => a.currentFinishTime - b.currentFinishTime);

  const isRunning = (u: VillageUpgrade) => now === null || u.currentFinishTime > now;
  // Goblin builder / goblin researcher slots don't occupy a regular builder or lab
  const mainSlot = (key: GroupKey) => (grouped.get(key) ?? []).filter((u) => !u.isExtraSlot);

  const busyBuilders = mainSlot("builders").filter(isRunning);
  const goblinBusy = (grouped.get("builders") ?? []).some((u) => u.isExtraSlot && isRunning(u));
  const nextBuilderFree = busyBuilders[0]?.currentFinishTime;
  // The export only counts Builder's Huts; B.O.B. (and any other bonus builder)
  // isn't listed, so never claim fewer builders than are visibly working.
  const builderTotal =
    village.builderCount !== null ? Math.max(village.builderCount, busyBuilders.length) : null;
  const idleBuilders =
    builderTotal !== null ? Math.max(0, builderTotal - busyBuilders.length) : null;
  const builderDetail =
    idleBuilders !== null && idleBuilders > 0
      ? `${idleBuilders} builder${idleBuilders === 1 ? "" : "s"} idle!`
      : nextBuilderFree && now !== null
        ? `Next free in ${formatDuration(nextBuilderFree - now)}`
        : busyBuilders.length === 0
          ? "All builders free"
          : null;

  const labBusy = mainSlot("lab").filter(isRunning);
  const petsBusy = mainSlot("pets").filter(isRunning);
  const bbBusy = mainSlot("builderBase").filter(isRunning);

  const exportAge =
    now !== null && village.lastExportTimestamp !== null
      ? now - village.lastExportTimestamp
      : null;

  const displayName = village.playerName ?? village.playerTag;
  useTabCountdown(displayName, village.upgrades.map((u) => u.currentFinishTime), now);
  const finished = now === null ? [] : village.upgrades.filter((u) => u.currentFinishTime <= now);

  // Mobile: once the heading's "Update timers" button scrolls away, show a sticky one
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setHeaderVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const showStickyUpdate = canUpdate && !updateOpen && !headerVisible;

  return (
    <div className="space-y-6">
      <div ref={headerRef}>
      <Card tone="wood" className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 sm:p-6">
        <IconChip size="lg">
          <Hammer />
        </IconChip>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <Heading as="h1" size="lg" gold className="truncate min-w-0">
              {displayName}
            </Heading>
            {ownership.state === "account_owner" && !demo && (
              <Badge tone="green" icon={<ShieldCheck className="w-3 h-3" />} className="shrink-0">
                <span title="Linked to your Discord account. Only you can update it, from any device.">
                  Linked to you
                </span>
              </Badge>
            )}
          </div>
          {profile}
          <p className="text-sm font-semibold text-cream/90 min-h-5 tabular-nums">
            {village.playerName && <>{village.playerTag} · </>}
            {exportAge === null ? " " : `Synced ${formatAge(exportAge)}`}
          </p>
        </div>
        {canUpdate && !updateOpen && (
          <Button onClick={() => setUpdateOpen(true)} className="max-sm:w-full">
            <RefreshCw className="w-4 h-4" />
            Update timers
          </Button>
        )}
      </Card>
      </div>

      {updateOpen && <UpdatePanel tag={village.playerTag} onClose={() => setUpdateOpen(false)} />}

      {canUpdate && (
        <SetupChecklist
          ownership={ownership}
          alertsOn={village.webhookAlerts || village.dmAlerts}
          onUpdate={() => setUpdateOpen(true)}
        />
      )}

      {finished.length > 0 && !demo && (
        <div role="status" className="panel-stone !border-grass/70 flex flex-wrap items-center gap-3 p-4 text-sm font-semibold text-cream/90 animate-fade-in">
          <IconChip tone="green" size="sm">
            <CheckCircle2 />
          </IconChip>
          <p className="flex-1 min-w-[12rem]">
            <b className="text-grass">
              {finished.length === 1
                ? `${upgradeLabel(finished[0])} is done!`
                : `${finished.length} upgrades are done!`}
            </b>{" "}
            Start your next {finished.length === 1 ? "upgrade" : "ones"} in the game, then update your timers so
            ClashSync can track {finished.length === 1 ? "it" : "them"}.
          </p>
          {canUpdate ? (
            <Button size="sm" onClick={() => setUpdateOpen(true)} className="max-sm:w-full">
              <RefreshCw className="w-3.5 h-3.5" />
              Update timers
            </Button>
          ) : (
            <Link href="/#sync" className="font-extrabold text-gold-300 underline decoration-2 underline-offset-2 hover:text-cream">
              Paste a fresh export
            </Link>
          )}
        </div>
      )}

      {exportAge !== null && exportAge > STALE_AFTER_SECONDS && (
        <div role="status" className="panel-stone !border-gold-500 flex items-start gap-3 p-4 text-sm font-semibold text-gold-100 animate-fade-in">
          <IconChip size="sm">
            <TriangleAlert />
          </IconChip>
          <div className="flex-1 self-center">
            Your export is {formatDuration(exportAge)} old, so upgrades you&apos;ve started since
            won&apos;t show here.{" "}
            {canUpdate ? (
              <button
                type="button"
                onClick={() => setUpdateOpen(true)}
                className="cursor-pointer font-extrabold text-gold-300 underline decoration-2 underline-offset-2 hover:text-cream"
              >
                Update your timers
              </button>
            ) : (
              <Link href="/#sync" className="font-extrabold text-gold-300 underline decoration-2 underline-offset-2 hover:text-cream">
                Re-sync for accuracy
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Status tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusTile
          group="builders"
          headline={
            builderTotal !== null
              ? `${busyBuilders.length}/${builderTotal} busy`
              : `${busyBuilders.length} busy`
          }
          detail={
            goblinBusy
              ? ["+ Goblin", builderDetail].filter(Boolean).join(" · ")
              : builderDetail
          }
          alert={(idleBuilders ?? 0) > 0 || (busyBuilders.length === 0 && now !== null)}
          hint={
            <Hint label="busy builders">
              {builderTotal !== null
                ? `How many of your ${builderTotal} builders are upgrading something right now.`
                : "How many builders are upgrading something right now. This export didn’t include your total number of builders, so we can’t tell how many are free."}{" "}
              The Goblin Builder is shown separately (&ldquo;+ Goblin&rdquo;) because it&apos;s a temporary bonus builder.
            </Hint>
          }
        />
        <SlotTile group="lab" busy={labBusy} now={now} idleText="Lab is idle!" />
        <SlotTile group="pets" busy={petsBusy} now={now} idleText="Pet House is idle" />
        <SlotTile group="builderBase" busy={bbBusy} now={now} idleText="Nothing upgrading" />
      </div>

      <TonightCard
        now={now}
        rows={village.upgrades
          .filter((u) => now === null || u.currentFinishTime > now)
          .map((u) => {
            const { tone, Icon } = GROUPS[groupOf(u)];
            return { id: u.id, label: upgradeLabel(u), tone, Icon, finish: u.currentFinishTime };
          })}
      />

      {/* Upgrade lists */}
      {village.upgrades.length === 0 ? (
        <Card className="p-8 text-center font-display text-lg text-cream/85">
          No upgrades were running in your last export.
        </Card>
      ) : (
        // Masonry columns so a short group doesn't leave a gap. Spacing is padding, not
        // margin: margins get cut off at column breaks and the next card would overlap.
        <div className="lg:columns-2 gap-4 -mb-4">
          {(Object.keys(GROUPS) as GroupKey[])
            .filter((key) => grouped.has(key))
            .map((key) => (
              <div key={key} className="break-inside-avoid pb-4">
                <UpgradeGroup group={key} items={grouped.get(key)!} now={now} />
              </div>
            ))}
        </div>
      )}

      <PotionBar
        village={village}
        now={now}
        canEdit={canEdit}
        lockedNote={
          demo
            ? "On your own dashboard, tap a potion after you drink it in the game and every affected timer moves."
            : undefined
        }
      />

      {isOwner && !demo && (
        <div id="alerts" className="scroll-mt-20">
        <AlertsCard
          tag={village.playerTag}
          webhookOn={village.webhookAlerts}
          dmOn={village.dmAlerts}
          leadMinutes={village.alertLeadMinutes}
          idleReminders={village.idleReminders}
          dmAvailable={ownership.dmAvailable}
        />
        </div>
      )}

      {!demo && <OwnershipCard tag={village.playerTag} ownership={ownership} />}

      {showStickyUpdate && (
        <>
          {/* Keeps the last card clear of the bar */}
          <div aria-hidden className="h-16 sm:hidden" />
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t-2 border-black/50 bg-night-900/90 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-fade-in">
            <Button onClick={() => setUpdateOpen(true)} className="w-full">
              <RefreshCw className="w-4 h-4" />
              Update timers
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function StatusTile({
  group,
  headline,
  detail,
  alert,
  hint,
}: {
  group: GroupKey;
  headline: string;
  detail: string | null;
  alert: boolean;
  hint?: ReactNode;
}) {
  const { label, Icon, tone } = GROUPS[group];
  return <Tile icon={Icon} tone={tone} label={label} headline={headline} detail={detail} alert={alert} hint={hint} />;
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
                <div className="text-sm font-bold text-cream truncate">{upgradeLabel(u)}</div>
                <div className="text-xs font-semibold text-faint tabular-nums">
                  Lv {u.currentLevel} → {u.targetLevel}
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
                <div className="text-xs font-semibold text-cream/70 tabular-nums min-h-4">
                  {now !== null && formatClock(u.currentFinishTime)}
                </div>
              </div>
            </li>
          );
        })}
      </Well>
    </Card>
  );
}
