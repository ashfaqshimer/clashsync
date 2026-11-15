import Link from "next/link";
import { Plus } from "lucide-react";
import type { OwnedVillage } from "@/lib/village";
import { DiscordLoginButton } from "@/app/_components/account-menu";
import { buttonClass } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import { VillageRows } from "./village-rows";

/** Presentational states of the "My villages" list. Data loading stays in page.tsx. */

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

export function VillageListView({
  villages,
  showAddLink = true,
}: {
  villages: OwnedVillage[];
  showAddLink?: boolean;
}) {
  return (
    <section className="space-y-3">
      <VillageRows villages={villages} />
      {showAddLink && <AddVillageLink />}
    </section>
  );
}

function AddVillageLink() {
  return (
    <Link href="/#sync" className={buttonClass()}>
      <Plus className="w-4 h-4" />
      Sync a village
    </Link>
  );
}
