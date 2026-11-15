"use client";

import { useId, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { cx } from "./cx";

/**
 * Small "?" button that explains a term. Opens on tap/click, hover or focus;
 * closes on blur (tap elsewhere), mouse leave or Escape. `align` picks which edge the bubble
 * lines up with, so it stays on screen near the page edges.
 */
export function Hint({
  label,
  align = "start",
  children,
}: {
  /** The term being explained (for the button's accessible name). */
  label: string;
  align?: "start" | "end";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex align-middle normal-case tracking-normal"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`What does “${label}” mean?`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        // Focus/hover already opened it; a click must not toggle it shut. Blur or Escape closes.
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="grid h-5 w-5 cursor-help place-items-center rounded-full text-muted transition hover:text-gold-200 focus-visible:outline-2 focus-visible:outline-sky"
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cx(
            "absolute top-full z-30 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-lg border-2 border-ink bg-night-800 p-2.5 text-left font-sans text-xs font-semibold leading-snug text-cream shadow-[0_4px_0_rgb(0_0_0/0.5)] animate-fade-in",
            align === "start" ? "-left-2" : "-right-2"
          )}
        >
          {children}
        </span>
      )}
    </span>
  );
}
