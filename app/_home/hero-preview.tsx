"use client";

import { FlaskConical, Hammer, PawPrint } from "lucide-react";
import { formatDuration } from "@/lib/parser";
import { upgradeLabel } from "@/lib/upgrade-label";
import { demoVillage } from "@/lib/demo-village";
import { useNow } from "@/app/v/[tag]/use-now";
import { DiscordPing } from "@/app/_components/discord-ping";
import { IconChip, type Tone } from "@/app/_components/ui/badge";
import { Well } from "@/app/_components/ui/card";

const ROWS: Array<{ id: string; Icon: typeof Hammer; tone: Tone }> = [
  { id: "it", Icon: Hammer, tone: "gold" },
  { id: "ed", Icon: FlaskConical, tone: "elixir" },
  { id: "un", Icon: PawPrint, tone: "green" },
];

/** Hero illustration: a slice of the live dashboard (demo data) plus the Discord alert it sends. */
export function HeroPreview() {
  const now = useNow();
  // Before the first client tick, lay out the same rows with blank timers
  const village = demoVillage(now ?? 0);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="panel-stone p-4 sm:p-5 space-y-3" aria-hidden>
        <div className="flex items-center justify-between gap-2">
          <span className="heading-outline is-gold text-lg">Your village</span>
          <span className="badge badge-green">Live</span>
        </div>
        <Well as="ul" className="divide-y-2 divide-black/25">
          {ROWS.map(({ id, Icon, tone }) => {
            const u = village.upgrades.find((x) => x.id === id)!;
            return (
              <li key={id} className="flex items-center gap-3 px-3 py-2.5">
                <IconChip tone={tone} size="sm">
                  <Icon />
                </IconChip>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-cream">{upgradeLabel(u)}</div>
                  <div className="text-xs font-semibold text-faint tabular-nums">
                    Lv {u.currentLevel} → {u.targetLevel}
                  </div>
                </div>
                <span className="timer shrink-0 text-sm text-gold-300">
                  {now === null ? "--" : formatDuration(u.currentFinishTime - now)}
                </span>
              </li>
            );
          })}
        </Well>
      </div>
      {/* Overlaps only the panel's bottom padding, so no timer row is covered */}
      <DiscordPing className="relative -mt-3 mx-3 sm:ml-8 sm:-mr-4 rotate-[-1.5deg]" />
    </div>
  );
}
