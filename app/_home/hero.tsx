import Link from "next/link";
import { ArrowDown, Eye } from "lucide-react";
import { buttonClass } from "@/app/_components/ui/button";
import { HeroPreview } from "./hero-preview";

/** First screen for new visitors: what ClashSync does, in one look. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-center gap-8 lg:gap-12 lg:grid-cols-[1.1fr_1fr] pt-2 sm:pt-6"
    >
      <div className="space-y-5 text-center lg:text-left">
        <span className="badge badge-sky">Upgrade tracker for Clash of Clans</span>
        <h1 id="hero-title" className="heading-outline text-4xl sm:text-5xl leading-[1.05]">
          Never let a builder <span className="whitespace-nowrap text-gold-300">sit idle.</span>
        </h1>
        <p className="mx-auto lg:mx-0 max-w-xl text-base sm:text-lg font-semibold text-cream/90">
          Paste your village export, see every upgrade timer, and get a Discord ping before each one
          finishes.
        </p>
        <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-1">
          <a href="#sync" className={buttonClass({ size: "lg" })}>
            Track my village
            <ArrowDown className="w-5 h-5" />
          </a>
          <Link href="/demo" className={buttonClass({ variant: "stone", size: "lg" })}>
            <Eye className="w-5 h-5" />
            See a live demo
          </Link>
        </div>
        <p className="text-xs font-semibold text-muted">
          No password needed. Builders, lab, pet house and builder base.
        </p>
      </div>
      <HeroPreview />
    </section>
  );
}
