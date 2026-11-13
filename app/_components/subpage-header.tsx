import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { AccountMenu } from "./account-menu";

/** Header for inner pages: back-to-home wordmark, optional actions, account menu. */
export function SubpageHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-black/60 bg-night-900/85 shadow-[0_4px_0_rgb(0_0_0/0.25)] backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="group flex items-center gap-1.5 rounded-lg px-1 py-1 transition focus-visible:outline-3 focus-visible:outline-sky"
        >
          <ArrowLeft className="w-4 h-4 text-muted transition group-hover:-translate-x-0.5 group-hover:text-cream" />
          <span className="heading-outline text-lg">
            Clash<span className="text-gold-300">Sync</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {actions}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
