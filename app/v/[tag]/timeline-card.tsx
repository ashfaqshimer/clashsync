"use client";

import { CalendarClock, Moon } from "lucide-react";
import { formatDuration } from "@/lib/parser";
import {
  NIGHT_END_HOUR,
  NIGHT_START_HOUR,
  TIMELINE_WINDOW_SECONDS,
  finishesOvernight,
  nightBands,
  timelineBar,
} from "@/lib/timeline";
import { IconChip, type Tone } from "@/app/_components/ui/badge";
import { Card, CardHeader } from "@/app/_components/ui/card";
import { Hint } from "@/app/_components/ui/hint";

export interface TimelineRow {
  id: string;
  label: string;
  tone: Tone;
  finish: number;
}

const BAR: Record<Tone, string> = {
  gold: "bg-gold-400",
  elixir: "bg-elixir",
  green: "bg-grass",
  sky: "bg-sky",
  red: "bg-ruby",
  stone: "bg-muted",
  discord: "bg-discord",
};

const TICKS = [0, 6, 12, 18, 24];

function hourLabel(epoch: number) {
  return new Date(epoch * 1000).toLocaleTimeString(undefined, { hour: "numeric" });
}

function clockLabel(epoch: number) {
  return new Date(epoch * 1000).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * "Next 24 hours": one bar per running upgrade, ending when that slot frees up,
 * over shaded night hours, so players can see what will sit idle while they sleep.
 */
export function TimelineCard({ rows, now }: { rows: TimelineRow[]; now: number | null }) {
  if (rows.length === 0) return null;
  // The viewer's clock is only known on the client
  const offset = now === null ? 0 : -new Date().getTimezoneOffset();
  const sorted = [...rows].sort((a, b) => a.finish - b.finish);
  const overnight = now === null ? [] : sorted.filter((r) => finishesOvernight(r.finish, now, offset));
  const nightLabel = `${NIGHT_START_HOUR > 12 ? NIGHT_START_HOUR - 12 : NIGHT_START_HOUR} PM–${NIGHT_END_HOUR} AM`;

  return (
    <Card aria-labelledby="timeline-title" className="p-4 sm:p-5 space-y-3">
      <CardHeader
        icon={
          <IconChip tone="sky" size="sm">
            <CalendarClock />
          </IconChip>
        }
        title={
          <span id="timeline-title" className="inline-flex items-center gap-1.5">
            Next 24 hours
            <Hint label="the timeline">
              Each bar ends when that builder, lab or pet frees up. The shaded part is night ({nightLabel} your
              time): anything that finishes there sits idle until you&apos;re back in the game.
            </Hint>
          </span>
        }
      />

      <p className="text-sm font-semibold min-h-5">
        {now === null ? (
          " "
        ) : overnight.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-gold-200">
            <Moon className="w-4 h-4 shrink-0" aria-hidden />
            {overnight.length === 1
              ? `${overnight[0].label} finishes overnight and will sit idle until morning.`
              : `${overnight.length} upgrades finish overnight and will sit idle until morning.`}
          </span>
        ) : (
          <span className="text-cream/85">Nothing finishes overnight. Nice planning!</span>
        )}
      </p>

      <div className="well p-3 space-y-2">
        {/* Hour axis, aligned with the tracks */}
        <div className="grid sm:grid-cols-[minmax(0,10rem)_1fr_5.5rem] gap-3 items-end">
          <span className="max-sm:hidden" />
          <div className="relative h-4 text-xs font-semibold text-faint tabular-nums whitespace-nowrap" aria-hidden>
            {now !== null &&
              TICKS.map((h) => (
                <span
                  key={h}
                  className={`absolute top-0 ${h === 0 ? "" : h === 24 ? "-translate-x-full" : "-translate-x-1/2"}`}
                  style={{ left: `${(h / 24) * 100}%` }}
                >
                  {h === 0 ? "Now" : hourLabel(now + h * 3600)}
                </span>
              ))}
          </div>
          <span className="max-sm:hidden" />
        </div>

        {/* Phones: name + time on one line, full-width bar below. Wider: one row each. */}
        <ul className="space-y-2.5 sm:space-y-1.5">
          {sorted.map((r) => {
            const bar = now === null ? null : timelineBar(r.finish, now);
            const night = overnight.includes(r);
            return (
              <li
                key={r.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,10rem)_1fr_5.5rem] gap-x-3 gap-y-1 items-center"
              >
                <span className="text-sm font-bold text-cream truncate" title={r.label}>
                  {r.label}
                </span>
                <div className="relative h-3 rounded-full bg-black/35 overflow-hidden col-span-2 order-last sm:col-span-1 sm:order-none" aria-hidden>
                  {now !== null &&
                    nightBands(now, offset).map((b) => (
                      <span
                        key={b.start}
                        className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,rgb(76_120_190/0.28)_0_4px,transparent_4px_8px)]"
                        style={{ left: `${b.start * 100}%`, width: `${(b.end - b.start) * 100}%` }}
                      />
                    ))}
                  {bar && (
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full ${BAR[r.tone]} ${bar.beyond ? "opacity-70" : ""}`}
                      style={{ width: `max(${bar.end * 100}%, 0.5rem)` }}
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-bold tabular-nums text-right inline-flex items-center justify-end gap-1 ${
                    night ? "text-gold-300" : "text-cream/80"
                  }`}
                >
                  {night && <Moon className="w-3 h-3 shrink-0" aria-label="finishes overnight" />}
                  {now === null
                    ? " "
                    : r.finish - now > TIMELINE_WINDOW_SECONDS
                      ? `in ${formatDuration(r.finish - now).split(" ").slice(0, 2).join(" ")}`
                      : clockLabel(r.finish)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
