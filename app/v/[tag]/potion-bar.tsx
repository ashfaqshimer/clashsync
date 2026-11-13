"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Hammer, Loader2, Undo2, Zap } from "lucide-react";
import { boostedFinishTime, nextBoostWindow, POTIONS, type PotionKind } from "@/lib/boosts";
import { formatDuration } from "@/lib/parser";
import type { VillageSnapshot } from "@/lib/village";

const STYLE: Record<PotionKind, { Icon: typeof Hammer; button: string }> = {
  BUILDER_POTION: {
    Icon: Hammer,
    button:
      "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300",
  },
  RESEARCH_POTION: {
    Icon: FlaskConical,
    button:
      "bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-300",
  },
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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Zap className="w-4 h-4 text-amber-400" />
          Potions
        </h2>
        {canEdit && village.undoableBoost && (
          <button
            type="button"
            onClick={() => send("DELETE")}
            disabled={pending !== null}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-50 transition cursor-pointer"
          >
            {pending === "UNDO" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Undo2 className="w-3.5 h-3.5" />
            )}
            Undo {POTIONS[village.undoableBoost.kind].label}
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {(Object.keys(POTIONS) as PotionKind[]).map((kind) => {
          const { Icon, button } = STYLE[kind];
          const p = now === null ? null : preview(village, kind, now);
          const disabled = !canEdit || pending !== null || p === null || p.count === 0;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => send("POST", kind)}
              disabled={disabled}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${button}`}
            >
              {pending === kind ? (
                <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
              ) : (
                <Icon className="w-5 h-5 shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  I used a {POTIONS[kind].label}
                </span>
                <span className="block text-[11px] text-slate-400">
                  {p === null
                    ? " "
                    : p.count === 0
                      ? "Nothing to speed up right now"
                      : `Saves ${formatDuration(p.saved)} across ${p.count} upgrade${p.count === 1 ? "" : "s"}`}
                  {p && p.activeFor > 0 && (
                    <span className="text-amber-300"> · boosted, {formatDuration(p.activeFor)} left</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!canEdit && (
        <p className="text-xs text-slate-500">Only the verified owner can log potions for this village.</p>
      )}
      {message && (
        <p className={`text-xs ${message.tone === "ok" ? "text-emerald-400" : "text-rose-400"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
