"use client";

import type { ReactNode } from "react";
import { BellRing, ChevronDown } from "lucide-react";
import { alertLeadLabel } from "@/lib/alerts";
import { IconChip } from "@/app/_components/ui/badge";

/**
 * Bottom of the dashboard: setup, alerts and ownership. While something still
 * needs doing it's shown open; once the owner has alerts on it folds into one
 * summary line ("Alerts on · DM + channel · 5 min before") that opens on tap.
 */
export function AccountSection({
  collapsed,
  webhookOn,
  dmOn,
  leadMinutes,
  children,
}: {
  /** Fold it away: the village is linked to the viewer and alerts are on. */
  collapsed: boolean;
  webhookOn: boolean;
  dmOn: boolean;
  leadMinutes: number;
  children: ReactNode;
}) {
  if (!collapsed) {
    return (
      <section id="account" aria-label="Alerts and account" className="space-y-6 scroll-mt-20">
        {children}
      </section>
    );
  }

  const where = [dmOn && "DM", webhookOn && "channel"].filter(Boolean).join(" + ");
  return (
    <details id="account" className="group panel-stone scroll-mt-20 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[inherit] p-4 sm:px-5 transition hover:bg-white/[0.03] focus-visible:outline-3 focus-visible:outline-sky">
        <IconChip tone="green" size="sm">
          <BellRing />
        </IconChip>
        <span className="flex-1 min-w-0">
          <span className="block font-display text-base text-cream">Alerts &amp; account</span>
          <span className="block text-xs font-semibold text-muted truncate">
            Alerts on · {where} · {alertLeadLabel(leadMinutes).toLowerCase()}
          </span>
        </span>
        <span className="text-xs font-bold text-muted max-sm:hidden group-open:hidden">Change</span>
        <ChevronDown className="w-5 h-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      {/* The alerts card brings its own panel; drop the outer one's padding around it */}
      <div className="space-y-6 border-t-2 border-black/30 p-3 sm:p-4">{children}</div>
    </details>
  );
}
