"use client";

import { FileCode2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { DiscordLoginButton } from "@/app/_components/account-menu";
import { ExportForm, ExportGuide } from "@/app/_components/export-form";
import { IconChip } from "@/app/_components/ui/badge";
import { Card, Heading } from "@/app/_components/ui/card";

/** Home page paste panel: the export form plus the in-game guide and an optional login nudge. */
export function SyncPanel() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <Card tone="wood" id="sync" className="p-4 sm:p-7 space-y-5">
      <div className="flex items-start gap-3">
        <IconChip size="lg">
          <FileCode2 />
        </IconChip>
        <div className="min-w-0">
          <Heading as="h2" size="lg">
            Track your village
          </Heading>
          <p className="text-sm font-semibold text-cream/90 mt-1.5">
            Paste your village export below. We&apos;ll find every upgrade that&apos;s running and open
            your live dashboard.
          </p>
        </div>
      </div>

      <ExportGuide />
      <ExportForm />

      {!isPending && !session && (
        <div className="well flex flex-col sm:flex-row sm:items-center gap-3 p-3.5">
          <p className="flex-1 text-sm font-semibold text-cream/85">
            <b className="text-cream">Optional:</b> log in first to link the village to your account.
            Then only you can update it, and you can turn on Discord alerts.
          </p>
          <DiscordLoginButton />
        </div>
      )}
    </Card>
  );
}
