import type { ReactNode } from "react";
import { Compass } from "lucide-react";
import { IconChip, type Tone } from "@/app/_components/ui/badge";
import { Card, CardHeader } from "@/app/_components/ui/card";

export interface NextMove {
  id: string;
  tone: Tone;
  icon: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  /** Button or link; omitted when the viewer can't act on it. */
  action?: ReactNode;
}

/** Most moves shown at once; the rest are less urgent and wait their turn. */
export const MAX_NEXT_MOVES = 3;

const TITLE_TONE: Partial<Record<Tone, string>> = {
  green: "text-grass",
  gold: "text-gold-200",
  red: "text-[#ff8a80]",
  sky: "text-sky",
  discord: "text-[#aab2ff]",
};

/**
 * One ranked list of what to do next (finished upgrades, idle builders, the
 * night plan, an old export, setup), instead of a separate banner for each.
 * Renders nothing when there's nothing to do. Pass moves most urgent first.
 */
export function NextMoves({ moves }: { moves: NextMove[] }) {
  const shown = moves.slice(0, MAX_NEXT_MOVES);
  if (shown.length === 0) return null;

  return (
    <Card aria-labelledby="next-moves-title" role="status" className="p-4 sm:p-5 space-y-3 animate-fade-in">
      <CardHeader
        icon={
          <IconChip tone="gold" size="sm">
            <Compass />
          </IconChip>
        }
        title={<span id="next-moves-title">Next moves</span>}
      />
      <ul className="well divide-y-2 divide-black/25">
        {shown.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3">
            <IconChip tone={m.tone} size="sm">
              {m.icon}
            </IconChip>
            <div className="flex-1 min-w-[12rem]">
              <p className={`text-sm font-extrabold ${TITLE_TONE[m.tone] ?? "text-cream"}`}>{m.title}</p>
              {m.body && <p className="text-xs font-semibold text-cream/80 mt-0.5">{m.body}</p>}
            </div>
            {m.action && <div className="shrink-0 max-sm:w-full max-sm:[&>*]:w-full">{m.action}</div>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
