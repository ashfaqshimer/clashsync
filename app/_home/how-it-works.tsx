import { BellRing, ClipboardCopy, ClipboardPaste, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconChip, type Tone } from "@/app/_components/ui/badge";
import { Card, Heading } from "@/app/_components/ui/card";

const STEPS: Array<{ Icon: LucideIcon; tone: Tone; title: string; body: React.ReactNode }> = [
  {
    Icon: ClipboardCopy,
    tone: "gold",
    title: "Copy",
    body: (
      <>
        In Clash of Clans, open <b className="text-cream">Settings → More Settings</b> and tap{" "}
        <b className="text-cream">Export Village data → Copy</b>.
      </>
    ),
  },
  {
    Icon: ClipboardPaste,
    tone: "sky",
    title: "Paste",
    body: "Paste it here. On a phone, the Paste button does it in one tap.",
  },
  {
    Icon: BellRing,
    tone: "green",
    title: "Relax",
    body: "Watch every timer count down live, and get a Discord alert before each upgrade finishes.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="space-y-4">
      <Heading as="h2" size="lg" className="text-center">
        <span id="how-title">How it works</span>
      </Heading>
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ Icon, tone, title, body }, i) => (
          <Card as="li" key={title} className="relative p-4 sm:p-5 space-y-2">
            <span
              aria-hidden
              className="absolute -top-2.5 -left-2.5 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-gradient-to-b from-gold-300 to-gold-600 font-display text-sm text-ink shadow-[0_2px_0_rgb(0_0_0/0.5)]"
            >
              {i + 1}
            </span>
            <div className="flex items-center gap-2.5">
              <IconChip tone={tone}>
                <Icon />
              </IconChip>
              <Heading as="h3" size="sm">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </Heading>
            </div>
            <p className="text-sm font-semibold text-cream/85">{body}</p>
          </Card>
        ))}
      </ol>
      <p className="well flex items-start sm:items-center justify-center gap-2 p-3 text-sm font-semibold text-gold-100">
        <RefreshCw className="w-4 h-4 mt-0.5 sm:mt-0 shrink-0 text-gold-300" aria-hidden />
        <span>
          Clash only shares timers through the export, so after you start new upgrades, paste a fresh
          export to update them.
        </span>
      </p>
    </section>
  );
}
