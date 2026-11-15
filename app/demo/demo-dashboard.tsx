"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Eye } from "lucide-react";
import { demoVillage } from "@/lib/demo-village";
import { LiveDashboard } from "@/app/v/[tag]/live-dashboard";
import { useNow } from "@/app/v/[tag]/use-now";
import { DiscordPing } from "@/app/_components/discord-ping";
import { IconChip } from "@/app/_components/ui/badge";
import { buttonClass } from "@/app/_components/ui/button";
import { Card, CardHeader, Heading } from "@/app/_components/ui/card";

/** The real dashboard, filled with a made-up village (times follow the viewer's clock). */
export function DemoDashboard() {
  const now = useNow();

  return (
    <div className="space-y-6">
      <div role="note" className="panel-stone !border-sky/60 flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        <div className="flex flex-1 items-start gap-3">
          <IconChip tone="sky" size="sm">
            <Eye />
          </IconChip>
          <p className="text-sm font-semibold text-cream/90">
            <b className="text-cream">This is a demo with made-up timers.</b> Paste your own village
            export and your dashboard will look just like this.
          </p>
        </div>
        <Link href="/#sync" className={buttonClass({ className: "self-end sm:self-auto shrink-0" })}>
          Track my village
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {now === null ? (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading demo">
          <div className="panel-wood h-24 opacity-70" />
          <div className="panel-stone h-64" />
        </div>
      ) : (
        <LiveDashboard
          village={demoVillage(now)}
          isOwner={false}
          canEdit={false}
          ownership={{ state: "unclaimed", loggedIn: false, dmAvailable: false }}
          demo
        />
      )}

      <Card className="p-4 sm:p-5 space-y-4">
        <CardHeader
          icon={
            <IconChip tone="discord" size="sm">
              <BellRing />
            </IconChip>
          }
          title="Discord alerts"
        />
        <div className="grid gap-4 md:grid-cols-2 md:items-center">
          <p className="text-sm font-semibold text-cream/85">
            Once your village is linked to your account, ClashSync messages you before each upgrade
            finishes: as a DM, in your clan&apos;s channel, or both. You pick how early, from 30 minutes
            before to right when it&apos;s done.
          </p>
          <DiscordPing />
        </div>
      </Card>

      <Card tone="wood" className="p-6 sm:p-8 text-center space-y-3">
        <Heading as="h2" size="lg">
          Ready to track your own village?
        </Heading>
        <p className="text-sm font-semibold text-cream/90">It takes about 30 seconds: copy your export in the game and paste it in.</p>
        <Link href="/#sync" className={buttonClass({ size: "lg" })}>
          Track my village
          <ArrowRight className="w-5 h-5" />
        </Link>
      </Card>
    </div>
  );
}
