import { RefreshCw } from "lucide-react";
import type { OwnedVillage } from "@/lib/village";
import { buttonClass } from "@/app/_components/ui/button";
import { Heading } from "@/app/_components/ui/card";
import { VillageListView } from "@/app/villages/village-list-views";

/** Returning player's village list at the top of the home page (presentational). */
export function WelcomeBack({ name, villages }: { name: string | null; villages: OwnedVillage[] }) {
  return (
    <section aria-labelledby="welcome-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="min-w-0">
          <Heading as="h1" size="lg">
            <span id="welcome-title">Welcome back{name ? `, ${name}` : ""}!</span>
          </Heading>
          <p className="mt-1 text-sm font-semibold text-cream/85">
            Started new upgrades? Paste a fresh export to update your timers.
          </p>
        </div>
        <a href="#sync" className={buttonClass({ className: "self-start sm:self-auto" })}>
          <RefreshCw className="w-4 h-4" />
          Update a village
        </a>
      </div>
      <VillageListView villages={villages} showAddLink={false} />
    </section>
  );
}
