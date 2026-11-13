import type { LucideIcon } from "lucide-react";
import { IconChip, Pip, type Tone } from "./badge";
import { cx } from "./cx";

/**
 * One slot's status (builders, lab, pets, builder base).
 * `alert` = needs the player's attention (something is idle): gold rim + "!" pip.
 */
export function StatusTile({
  icon: Icon,
  tone,
  label,
  headline,
  detail,
  alert,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  headline: string;
  detail: string | null;
  alert: boolean;
}) {
  return (
    <div
      className={cx(
        "panel-stone relative p-3 sm:p-4",
        alert && "!border-gold-500 ring-2 ring-gold-400/30"
      )}
    >
      {alert && (
        <>
          <Pip className="absolute -top-2 -right-2" aria-hidden>
            !
          </Pip>
          <span className="sr-only">Needs attention: </span>
        </>
      )}
      <div className="flex items-center gap-2">
        <IconChip tone={tone} size="sm">
          <Icon />
        </IconChip>
        <span className="label-caps truncate">{label}</span>
      </div>
      <div className="mt-2.5 font-display text-xl leading-tight text-cream tabular-nums sm:text-2xl">
        {headline}
      </div>
      <div
        className={cx(
          "mt-0.5 min-h-4 text-xs font-semibold tabular-nums",
          alert ? "text-gold-200" : "text-muted"
        )}
      >
        {detail ?? " "}
      </div>
    </div>
  );
}
