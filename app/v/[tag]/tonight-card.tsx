"use client";

import { useSyncExternalStore } from "react";
import { CheckCircle2, Moon, type LucideIcon } from "lucide-react";
import {
  DEFAULT_NIGHT,
  TIMELINE_WINDOW_SECONDS,
  nightBands,
  nightWindow,
  planNight,
  stripPosition,
  type NightHours,
} from "@/lib/timeline";
import { Badge, IconChip, type Tone } from "@/app/_components/ui/badge";
import { Card, CardHeader } from "@/app/_components/ui/card";

export interface TonightRow {
  id: string;
  label: string;
  tone: Tone;
  Icon: LucideIcon;
  finish: number;
}

const DOT: Record<Tone, string> = {
  gold: "bg-gold-400",
  elixir: "bg-elixir",
  green: "bg-grass",
  sky: "bg-sky",
  red: "bg-ruby",
  stone: "bg-muted",
  discord: "bg-discord",
};

const BEDTIMES = [20, 21, 22, 23, 0, 1, 2];
const WAKE_TIMES = [4, 5, 6, 7, 8, 9, 10, 11];
const STORAGE_KEY = "clashsync.night";

/** "11 PM" style label for an hour of the day. */
function hourName(h: number) {
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

function clock(epoch: number) {
  return new Date(epoch * 1000).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Rounded hours for idle time: "about 5h", "under 1h". */
function idleText(seconds: number) {
  const h = Math.round(seconds / 3600);
  return h < 1 ? "under 1h" : `${h}h`;
}

/** The viewer's sleep hours, remembered in this browser only (a convenience, not account data). */
const nightListeners = new Set<() => void>();
/** Used when storage is blocked, so a choice still applies for this visit. */
let memoryNight = "";
function readSavedNight(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryNight;
  } catch {
    return memoryNight;
  }
}
function subscribeNight(cb: () => void) {
  nightListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    nightListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function useNightHours(): [NightHours, (h: NightHours) => void] {
  // Server and first client render use the default, so the markup matches
  const saved = useSyncExternalStore(subscribeNight, readSavedNight, () => "");
  let hours: NightHours = DEFAULT_NIGHT;
  try {
    const parsed = saved ? JSON.parse(saved) : null;
    if (BEDTIMES.includes(parsed?.startHour) && WAKE_TIMES.includes(parsed?.endHour)) hours = parsed;
  } catch {
    // Bad value: keep the default
  }
  const save = (h: NightHours) => {
    memoryNight = JSON.stringify(h);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
    } catch {
      // Storage blocked: the choice can't be kept
    }
    nightListeners.forEach((cb) => cb());
  };
  return [hours, save];
}

/**
 * "Tonight": answers "will anything sit idle while I sleep?" first, then shows
 * finishes on one 24h strip and lists what to restart before bed.
 */
export function TonightCard({ rows, now }: { rows: TonightRow[]; now: number | null }) {
  const [hours, setHours] = useNightHours();
  if (rows.length === 0) return null;

  return (
    <Card aria-labelledby="tonight-title" className="p-4 sm:p-5 space-y-4">
      <CardHeader
        icon={
          <IconChip tone="sky" size="sm">
            <Moon />
          </IconChip>
        }
        title={<span id="tonight-title">Tonight</span>}
        actions={<NightPicker hours={hours} onChange={setHours} />}
      />
      {now === null ? <div className="h-40" aria-hidden /> : <TonightBody rows={rows} now={now} hours={hours} />}
    </Card>
  );
}

function NightPicker({ hours, onChange }: { hours: NightHours; onChange: (h: NightHours) => void }) {
  const select = "field !w-auto h-8 pl-2 pr-1 text-xs font-bold";
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
      <label htmlFor="night-start" className="max-sm:sr-only">Asleep</label>
      <select
        id="night-start"
        value={hours.startHour}
        onChange={(e) => onChange({ ...hours, startHour: Number(e.target.value) })}
        className={select}
      >
        {BEDTIMES.map((h) => (
          <option key={h} value={h}>{hourName(h)}</option>
        ))}
      </select>
      <label htmlFor="night-end" aria-label="until">–</label>
      <select
        id="night-end"
        value={hours.endHour}
        onChange={(e) => onChange({ ...hours, endHour: Number(e.target.value) })}
        className={select}
      >
        {WAKE_TIMES.map((h) => (
          <option key={h} value={h}>{hourName(h)}</option>
        ))}
      </select>
    </div>
  );
}

function TonightBody({ rows, now, hours }: { rows: TonightRow[]; now: number; hours: NightHours }) {
  const offset = -new Date().getTimezoneOffset();
  const night = nightWindow(now, offset, hours);
  const plan = planNight(rows, night, now);
  const asleep = now >= night.start;
  const bedtime = hourName(hours.startHour);
  const wake = hourName(hours.endHour);

  const headline =
    plan.overnight.length > 0
      ? {
          tone: "text-gold-300",
          title: `${plan.overnight.length} ${plan.overnight.length === 1 ? "slot goes" : "slots go"} idle overnight`,
          body: `Idle for about ${idleText(plan.idleSeconds)} in total before you're up at ${wake}. Starting something longer before bed keeps them busy.`,
        }
      : plan.beforeBed.length > 0
        ? {
            tone: "text-grass",
            title: "Nothing goes idle overnight",
            body: `${plan.beforeBed.length === 1 ? "One upgrade finishes" : `${plan.beforeBed.length} upgrades finish`} before ${bedtime}. Start the next one before you sleep and you're set.`,
          }
        : {
            tone: "text-grass",
            title: "Busy all night",
            body: "Everything keeps working until after you wake up. Sleep well, Chief!",
          };

  return (
    <>
      <div>
        <p className={`font-display text-lg leading-tight ${headline.tone}`}>{headline.title}</p>
        <p className="mt-1 text-sm font-semibold text-cream/85">{headline.body}</p>
      </div>

      <Strip rows={rows} now={now} offset={offset} hours={hours} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {plan.beforeBed.length > 0 && (
          <Section
            title={asleep ? "Done before you wake" : `Before ${bedtime}`}
            hint="Free before bed: start the next upgrade first."
          >
            {plan.beforeBed.map((r) => (
              <Row key={r.id} row={r} right={<span className="text-cream/80">{clock(r.finish)}</span>} />
            ))}
          </Section>
        )}
        {plan.overnight.length > 0 && (
          <Section title="While you sleep" hint={`Sits idle until you wake at ${wake}.`} highlight>
            {plan.overnight.map(({ item, idleSeconds }) => (
              <Row
                key={item.id}
                row={item}
                right={
                  <span className="inline-flex items-center gap-2">
                    <span className="text-gold-300">{clock(item.finish)}</span>
                    <Badge tone="red">idle {idleText(idleSeconds)}</Badge>
                  </span>
                }
              />
            ))}
          </Section>
        )}
      </div>

      {plan.allNight.length > 0 && (
        <p className="flex items-start gap-2 text-sm font-semibold text-muted">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-grass" aria-hidden />
          <span>
            <b className="text-cream/90">Working all night:</b>{" "}
            {plan.allNight.slice(0, 3).map((r) => r.label).join(", ")}
            {plan.allNight.length > 3 && ` and ${plan.allNight.length - 3} more`}
          </span>
        </p>
      )}
    </>
  );
}

function Section({
  title,
  hint,
  highlight = false,
  children,
}: {
  title: string;
  hint: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`well p-3 space-y-2 ${highlight ? "!border-gold-500/70" : ""}`}>
      <div>
        <h3 className={`font-display text-sm ${highlight ? "text-gold-200" : "text-cream"}`}>{title}</h3>
        <p className="text-xs font-semibold text-faint">{hint}</p>
      </div>
      <ul className="divide-y-2 divide-black/25">{children}</ul>
    </section>
  );
}

function Row({ row, right }: { row: TonightRow; right: React.ReactNode }) {
  const { Icon } = row;
  return (
    <li className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
      <IconChip tone={row.tone} size="sm">
        <Icon />
      </IconChip>
      <span className="flex-1 min-w-0 truncate text-sm font-bold text-cream">{row.label}</span>
      <span className="shrink-0 text-xs font-bold tabular-nums">{right}</span>
    </li>
  );
}

/** One 24h track: night shaded, a dot at each finish (stacked when they're close). */
function Strip({ rows, now, offset, hours }: { rows: TonightRow[]; now: number; offset: number; hours: NightHours }) {
  const placed: Array<{ row: TonightRow; pos: number; lane: number }> = [];
  const laneEnds: number[] = [];
  for (const row of [...rows].sort((a, b) => a.finish - b.finish)) {
    const pos = stripPosition(row.finish, now);
    if (pos === null) continue;
    let lane = laneEnds.findIndex((end) => pos - end >= 0.035);
    if (lane === -1) lane = laneEnds.length < 3 ? laneEnds.length : laneEnds.length - 1;
    laneEnds[lane] = pos;
    placed.push({ row, pos, lane });
  }
  const later = rows.filter((r) => r.finish - now > TIMELINE_WINDOW_SECONDS).length;
  const lanes = Math.max(1, laneEnds.length);

  return (
    <div aria-hidden className="space-y-1">
      <div className="relative h-4 text-xs font-semibold text-faint tabular-nums whitespace-nowrap">
        {[0, 6, 12, 18, 24].map((h) => (
          <span
            key={h}
            className={`absolute top-0 ${h === 0 ? "" : h === 24 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h === 0 ? "Now" : new Date((now + h * 3600) * 1000).toLocaleTimeString(undefined, { hour: "numeric" })}
          </span>
        ))}
      </div>
      <div
        className="relative rounded-lg bg-black/35 border-2 border-black/40 overflow-hidden"
        style={{ height: `${lanes * 14 + 14}px` }}
      >
        {nightBands(now, offset, hours).map((b) => (
          <span
            key={b.start}
            className="absolute inset-y-0 bg-[rgb(76_120_190/0.24)] border-x-2 border-sky/30"
            style={{ left: `${b.start * 100}%`, width: `${(b.end - b.start) * 100}%` }}
          />
        ))}
        {placed.map(({ row, pos, lane }) => (
          <span
            key={row.id}
            title={`${row.label} · ${clock(row.finish)}`}
            className={`absolute w-3 h-3 -translate-x-1/2 rounded-full border-2 border-ink ${DOT[row.tone]}`}
            style={{ left: `clamp(8px, ${pos * 100}%, calc(100% - 8px))`, bottom: `${7 + lane * 14}px` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-semibold text-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[rgb(76_120_190/0.24)] border-2 border-sky/30" />
          <Moon className="w-3 h-3 text-sky" /> Asleep
          <span className="mx-1 text-faint/60">·</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-ink bg-gold-400" /> Frees up
        </span>
        {later > 0 && (
          <span>
            {later} more finish{later === 1 ? "es" : ""} after{" "}
            {new Date((now + TIMELINE_WINDOW_SECONDS) * 1000).toLocaleTimeString(undefined, { hour: "numeric" })} tomorrow
          </span>
        )}
      </div>
    </div>
  );
}
