"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { IconChip } from "@/app/_components/ui/badge";

export interface JustSynced {
  upgrades: number;
  /** The sync linked the village to the logged-in account. */
  linked: boolean;
}

/** Confirmation after the home page redirects here from a sync. */
export function SyncedBanner({ upgrades, linked }: JustSynced) {
  // Drop ?synced=… from the address so a refresh or shared link doesn't repeat it
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <div role="status" className="panel-stone !border-grass/60 flex items-center gap-3 p-4 animate-fade-in">
      <IconChip tone="green" size="sm">
        <CheckCircle2 />
      </IconChip>
      <p className="text-sm font-bold text-cream">
        Village synced! Tracking {upgrades} upgrade{upgrades === 1 ? "" : "s"}.
        {linked && " It's now linked to your account."}
      </p>
    </div>
  );
}
