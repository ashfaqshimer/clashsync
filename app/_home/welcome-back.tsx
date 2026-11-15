import { RefreshCw } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getOwnedVillages } from "@/lib/village";
import { buttonClass } from "@/app/_components/ui/button";
import { Heading } from "@/app/_components/ui/card";
import { VillageListView, type OwnedVillageRow } from "@/app/villages/village-list-views";
import { Hero } from "./hero";

/**
 * Top of the home page. New visitors (and logged-in people with no villages yet)
 * get the hero; returning players see their villages first.
 */
export async function HomeTop() {
  const viewer = await getSessionUser();
  if (!viewer) return <Hero />;

  const villages = await getOwnedVillages(viewer.id);
  if (villages.length === 0) return <Hero />;

  return <WelcomeBack name={viewer.name} villages={villages} />;
}

export function WelcomeBack({ name, villages }: { name: string | null; villages: OwnedVillageRow[] }) {
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
