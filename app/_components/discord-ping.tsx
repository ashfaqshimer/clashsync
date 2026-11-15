import { Hammer } from "lucide-react";
import { cx } from "./ui/cx";

/**
 * Illustration of a ClashSync alert as it looks in Discord (same wording as lib/alerts.ts).
 * Decorative: screen readers get one sentence instead of a fake chat message.
 */
export function DiscordPing({
  item = "Inferno Tower Level 10",
  when = "done in 5 minutes",
  className,
}: {
  item?: string;
  when?: string;
  className?: string;
}) {
  return (
    <figure
      className={cx(
        "rounded-xl border-2 border-black/70 bg-[#313338] p-3 shadow-[0_4px_0_rgb(0_0_0/0.45)]",
        className
      )}
    >
      <figcaption className="sr-only">
        Example Discord alert: {item}, {when}.
      </figcaption>
      <div className="flex items-start gap-2.5" aria-hidden>
        <span className="icon-chip icon-chip-gold h-9 w-9 shrink-0 rounded-full [&>svg]:h-4.5 [&>svg]:w-4.5">
          <Hammer />
        </span>
        <div className="min-w-0 text-[13px] leading-snug">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-white">ClashSync</span>
            <span className="rounded bg-discord px-1 text-[10px] font-extrabold text-white">BOT</span>
            <span className="text-[11px] font-semibold text-[#949ba4]">Today</span>
          </div>
          <p className="mt-0.5 font-semibold text-[#dbdee1]">
            ⏰ Heads-up, Chief! <strong className="text-white">{item}</strong>: {when}.
          </p>
        </div>
      </div>
    </figure>
  );
}
