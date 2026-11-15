import { BellRing, Hammer, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconChip, type Tone } from "@/app/_components/ui/badge";
import { Card, Heading } from "@/app/_components/ui/card";

const FEATURES: Array<{ Icon: LucideIcon; tone: Tone; title: string; body: string }> = [
  {
    Icon: Hammer,
    tone: "gold",
    title: "Every queue in one place",
    body: "Builders, laboratory, pet house and builder base, with exact finish times and a warning when something sits idle.",
  },
  {
    Icon: Zap,
    tone: "elixir",
    title: "Potion math done for you",
    body: "Drank a Builder or Research Potion? Tap it and every affected timer moves. Potions stack, and you can undo a mistake.",
  },
  {
    Icon: BellRing,
    tone: "discord",
    title: "Discord alerts",
    body: "Get a DM or a post in your clan's channel when an upgrade finishes, or up to 30 minutes before, so you're ready to start the next one.",
  },
  {
    Icon: Users,
    tone: "sky",
    title: "All your accounts",
    body: "Log in with Discord once and keep your main and alt villages side by side. Only you can update them.",
  },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="space-y-4">
      <Heading as="h2" size="lg" className="text-center">
        <span id="features-title">What you get</span>
      </Heading>
      <ul className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ Icon, tone, title, body }) => (
          <Card as="li" key={title} className="flex items-start gap-3 p-4 sm:p-5">
            <IconChip tone={tone}>
              <Icon />
            </IconChip>
            <div className="min-w-0 space-y-1">
              <Heading as="h3" size="sm">
                {title}
              </Heading>
              <p className="text-sm font-semibold text-cream/85">{body}</p>
            </div>
          </Card>
        ))}
      </ul>
    </section>
  );
}
