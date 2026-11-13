import { Hammer } from "lucide-react";
import { AccountMenu } from "@/app/_components/account-menu";
import { Badge, IconChip } from "@/app/_components/ui/badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-black/60 bg-night-900/85 shadow-[0_4px_0_rgb(0_0_0/0.25)] backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconChip size="lg" className="max-sm:h-10 max-sm:w-10">
            <Hammer className="stroke-[2.5]" />
          </IconChip>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="heading-outline text-xl sm:text-2xl">
                Clash<span className="text-gold-300">Sync</span>
              </span>
              <Badge tone="red" className="hidden min-[400px]:inline-flex">
                Live Tracker
              </Badge>
            </div>
            <p className="text-xs font-semibold text-muted hidden sm:block">
              Clash of Clans Village & Queue Tracker
            </p>
          </div>
        </div>
        <AccountMenu />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-black/50 py-6 text-center text-xs font-semibold text-faint mt-auto">
      <p>
        ClashSync — Unofficial Clash of Clans companion tool.
      </p>
    </footer>
  );
}
