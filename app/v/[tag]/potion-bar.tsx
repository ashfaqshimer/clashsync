"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Hammer, Loader2, Undo2, Zap } from "lucide-react";
import { boostedFinishTime, nextBoostWindow, POTIONS, type PotionKind } from "@/lib/boosts";
import { formatDuration } from "@/lib/parser";
import type { VillageSnapshot } from "@/lib/village";
import { IconChip, type Tone } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card, CardHeader } from "@/app/_components/ui/card";

const STYLE: Record<PotionKind, { Icon: typeof Hammer; tone: Tone; button: string }> = {
  BUILDER_POTION: { Icon: Hammer, tone: "gold", button: "text-gold-200 enabled:hover:border-gold-500/80" },
  RESEARCH_POTION: { Icon: FlaskConical, tone: "elixir", button: "text-[#f6b8ff] enabled:hover:border-elixir/80" },
};

/** What a potion would do if popped at `now`, computed the same way as the server. */
function preview(village: VillageSnapshot, kind: PotionKind, now: number) {
  const spec = POTIONS[kind];
  const endsAt = kind === "BUILDER_POTION" ? village.builderBoostEndsAt : village.labBoostEndsAt;
  const window = nextBoostWindow(now, endsAt, spec.durationSeconds);
  let count = 0;
  let saved = 0;
  for (const u of village.upgrades) {
    if (u.category !== spec.category || u.villageType !== "HOME") continue;
    if (u.currentFinishTime <= window.start) continue;
    count += 1;
    saved +=
      u.currentFinishTime -
      boostedFinishTime(u.currentFinishTime, window.start, spec.multiplier, spec.durationSeconds);
  }
  const activeFor = endsAt !== null && endsAt > now ? endsAt - now : 0;
  return { count, saved, activeFor };
}

export function PotionBar({
  village,
  now,
  canEdit,
}: {
  village: VillageSnapshot;
  now: number | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PotionKind | "UNDO" | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const send = async (method: "POST" | "DELETE", kind?: PotionKind) => {
    setPending(kind ?? "UNDO");
    setMessage(null);
    try {
      const res = await fetch("/api/village/boosts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: village.playerTag, kind }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(
          method === "POST"
            ? {
                text: `${POTIONS[data.kind as PotionKind].label} applied: ${formatDuration(
                  data.savedSeconds
                )} saved across ${data.upgradesBoosted} upgrade${data.upgradesBoosted === 1 ? "" : "s"}.`,
                tone: "ok",
              }
            : { text: "Potion undone. Timers restored.", tone: "ok" }
        );
        router.refresh();
      } else {
        setMessage({ text: data.error ?? "Something went wrong.", tone: "error" });
      }
    } catch {
      setMessage({ text: "Couldn't reach ClashSync. Try again.", tone: "error" });
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="p-4 sm:p-5 space-y-3">
      <CardHeader
        icon={
          <IconChip size="sm">
            <Zap />
          </IconChip>
        }
        title="Potions"
        actions={
          canEdit &&
          village.undoableBoost && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => send("DELETE")}
            disabled={pending !== null}
          >
            {pending === "UNDO" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Undo2 className="w-3.5 h-3.5" />
            )}
            Undo {POTIONS[village.undoableBoost.kind].label}
          </Button>
          )
        }
      />

      <div className="grid sm:grid-cols-2 gap-3">
        {(Object.keys(POTIONS) as PotionKind[]).map((kind) => {
          const { Icon, tone, button } = STYLE[kind];
          const p = now === null ? null : preview(village, kind, now);
          const disabled = !canEdit || pending !== null || p === null || p.count === 0;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => send("POST", kind)}
              disabled={disabled}
              className={`group flex items-center gap-3 p-3 rounded-xl border-2 border-black/70 text-left bg-gradient-to-b from-night-700 to-night-800 shadow-[inset_0_2px_0_rgb(255_255_255/0.1),inset_0_-2px_0_rgb(0_0_0/0.25),0_3px_0_rgb(0_0_0/0.55)] transition cursor-pointer enabled:hover:brightness-110 enabled:active:translate-y-[3px] enabled:active:shadow-none disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky mb-[3px] ${button}`}
            >
              <IconChip tone={tone}>
                {pending === kind ? <Loader2 className="animate-spin" /> : <Icon />}
              </IconChip>
              <span className="min-w-0">
                <span className="block font-display text-base leading-tight">
                  I used a {POTIONS[kind].label}
                </span>
                <span className="block text-xs font-semibold text-muted mt-0.5 tabular-nums">
                  {p === null
                    ? " "
                    : p.count === 0
                      ? "Nothing to speed up right now"
                      : `Saves ${formatDuration(p.saved)} across ${p.count} upgrade${p.count === 1 ? "" : "s"}`}
                  {p && p.activeFor > 0 && (
                    <span className="text-gold-300"> · boosted, {formatDuration(p.activeFor)} left</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!canEdit && (
        <p className="text-xs font-semibold text-faint">Only the verified owner can log potions for this village.</p>
      )}
      {message && (
        <p role="status" className={`text-sm font-bold ${message.tone === "ok" ? "text-grass" : "text-[#ff8a80]"}`}>
          {message.text}
        </p>
      )}
    </Card>
  );
}
