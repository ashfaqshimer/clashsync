import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Heading } from "@/app/_components/ui/card";

const B = ({ children }: { children: ReactNode }) => <b className="text-cream">{children}</b>;

const FAQS: Array<{ q: string; a: ReactNode }> = [
  {
    q: "Is it safe to paste my village export?",
    a: (
      <>
        Yes. Export Village data is a built-in Clash of Clans feature. It lists your buildings, troops,
        levels and upgrade timers, and nothing else: no password, no login, no email. ClashSync can
        read your timers but can&apos;t touch your account or change anything in the game.
      </>
    ),
  },
  {
    q: "Is ClashSync made by Supercell?",
    a: "No. It's an unofficial fan-made tool and isn't endorsed by Supercell.",
  },
  {
    q: "Why do I have to paste my export again?",
    a: (
      <>
        Clash of Clans only shares upgrade timers through the export, so ClashSync can&apos;t see
        upgrades you started afterwards. Whenever you start new upgrades, copy a fresh export and paste
        it here. Timers already on your dashboard keep counting down on their own, and the dashboard
        warns you when your export is getting old.
      </>
    ),
  },
  {
    q: "Do I need an account?",
    a: (
      <>
        No, you can paste an export and see your dashboard without logging in. Logging in with Discord
        links the village to you, so <B>only you can update it</B>, and unlocks <B>Discord alerts</B>{" "}
        and the <B>My villages</B> list. When you log in we add you to the ClashSync Discord server,
        because Discord only lets bots DM people who share a server with them.
      </>
    ),
  },
  {
    q: "How do I log a Builder or Research Potion?",
    a: (
      <>
        After you drink it in the game, open your dashboard and tap <B>I used a Builder Potion</B> (or
        Research Potion). Every affected timer moves forward. If you tap the wrong one, use{" "}
        <B>Undo</B>.
      </>
    ),
  },
  {
    q: "How do I turn on Discord alerts?",
    a: (
      <>
        Log in, sync your village, then open its dashboard and find the <B>Discord alerts</B> card. You
        can get a DM, post to a channel through a webhook, or both, and choose how early the alert
        arrives. Turn it off from the same card.
      </>
    ),
  },
  {
    q: "Someone else linked my village. How do I get it back?",
    a: (
      <>
        Use your API token, which proves the village is yours. In the game, go to{" "}
        <B>Settings → More Settings → API Token → Show</B> and copy it. Then open your dashboard while
        logged in and paste it into the <B>Linked to another account</B> card. The village moves to your
        account straight away.
      </>
    ),
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="space-y-4">
      <Heading as="h2" size="lg" className="text-center">
        <span id="faq-title">Questions</span>
      </Heading>
      <div className="panel-stone divide-y-2 divide-black/30 overflow-hidden">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 sm:px-5 py-3.5 font-bold text-cream transition hover:bg-white/[0.04] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-sky">
              {q}
              <ChevronDown className="w-5 h-5 shrink-0 text-gold-300 transition group-open:rotate-180" aria-hidden />
            </summary>
            <p className="px-4 sm:px-5 pb-4 text-sm font-semibold text-cream/85">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
