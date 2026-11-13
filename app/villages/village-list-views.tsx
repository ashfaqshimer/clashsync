import Link from "next/link";
import { ArrowRight, Hammer, Plus } from "lucide-react";
import { tagToSlug } from "@/lib/tags";
import { DiscordLoginButton } from "@/app/_components/account-menu";
import { IconChip } from "@/app/_components/ui/badge";
import { buttonClass } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import { VillageTimes } from "./village-times";

/** Presentational states of the "My villages" list. Data loading stays in page.tsx. */

export interface OwnedVillageRow {
  playerTag: string | null;
  activeUpgrades: number;
  nextFinishTime: number | null;
  lastExportTimestamp: number | null;
}

export function LoggedOutView() {
  return (
    <Card tone="wood" className="p-6 sm:p-8 text-center space-y-4">
      <p className="font-display text-lg text-cream">Log in to see the villages linked to your account.</p>
      <DiscordLoginButton next="/villages" />
    </Card>
  );
}

export function NoVillagesView() {
  return (
    <Card tone="wood" className="p-6 sm:p-8 text-center space-y-3">
      <p className="font-display text-xl text-cream">No villages linked yet.</p>
      <p className="text-sm font-semibold text-cream/90">
        Sync a village export while you&apos;re logged in and it&apos;s linked to your account.
      </p>
      <div className="pt-1">
        <AddVillageLink />
      </div>
    </Card>
  );
}

export function VillageListView({ villages }: { villages: OwnedVillageRow[] }) {
  return (
    <section className="space-y-3">
      <Card as="ul" className="divide-y-2 divide-black/30 overflow-hidden">
        {villages.map((v) =>
          v.playerTag ? (
            <li key={v.playerTag}>
              <Link
                href={`/v/${tagToSlug(v.playerTag)}`}
                className="group flex items-center gap-3 p-4 transition hover:bg-white/[0.04] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-sky"
              >
                <IconChip>
                  <Hammer />
                </IconChip>
                <div className="flex-1 min-w-0">
                  <p className="heading-outline is-gold text-lg truncate">{v.playerTag}</p>
                  <VillageTimes
                    activeUpgrades={v.activeUpgrades}
                    nextFinishTime={v.nextFinishTime}
                    lastExportTimestamp={v.lastExportTimestamp}
                  />
                </div>
                <ArrowRight className="w-5 h-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-gold-300" />
              </Link>
            </li>
          ) : null
        )}
      </Card>
      <AddVillageLink />
    </section>
  );
}

function AddVillageLink() {
  return (
    <Link href="/" className={buttonClass()}>
      <Plus className="w-4 h-4" />
      Sync a village
    </Link>
  );
}
