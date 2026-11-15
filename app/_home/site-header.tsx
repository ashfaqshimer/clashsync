import Link from "next/link";
import { Hammer } from "lucide-react";
import { AccountMenu } from "@/app/_components/account-menu";
import { IconChip } from "@/app/_components/ui/badge";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-black/60 bg-night-900/85 shadow-[0_4px_0_rgb(0_0_0/0.25)] backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 min-w-0 rounded-lg focus-visible:outline-3 focus-visible:outline-sky">
          <IconChip size="lg" className="max-sm:h-10 max-sm:w-10">
            <Hammer className="stroke-[2.5]" />
          </IconChip>
          <div className="min-w-0">
            <span className="heading-outline text-xl sm:text-2xl">
              Clash<span className="text-gold-300">Sync</span>
            </span>
            <p className="text-xs font-semibold text-muted hidden sm:block">
              Clash of Clans upgrade timers &amp; alerts
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <nav aria-label="Main" className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm font-bold text-cream/80 transition hover:bg-white/[0.06] hover:text-cream focus-visible:outline-3 focus-visible:outline-sky"
              >
                {label}
              </Link>
            ))}
          </nav>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-black/50 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold">
          {[...NAV, { href: "/villages", label: "My villages" }].map(({ href, label }) => (
            <Link key={href} href={href} className="text-cream/80 hover:text-gold-300 transition">
              {label}
            </Link>
          ))}
        </nav>
        <p className="mx-auto max-w-2xl text-xs font-semibold text-faint">
          This material is unofficial and is not endorsed by Supercell. For more information see{" "}
          <a
            href="https://supercell.com/en/fan-content-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-1 underline-offset-2 hover:text-cream"
          >
            Supercell&apos;s Fan Content Policy
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
