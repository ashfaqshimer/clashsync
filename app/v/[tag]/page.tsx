import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getVillage, getVillageName } from "@/lib/village";
import { getVillageAccess } from "@/lib/ownership";
import { isDmConfigured } from "@/lib/discord";
import { SubpageHeader } from "@/app/_components/subpage-header";
import { buttonClass } from "@/app/_components/ui/button";
import { Card, Heading } from "@/app/_components/ui/card";
import type { OwnershipState } from "./ownership-card";
import { normalizeTag, tagToSlug } from "@/lib/tags";
import { LiveDashboard } from "./live-dashboard";
import { PlayerProfile } from "./player-profile";
import { SyncedBanner, type JustSynced } from "./synced-banner";

/** Tab title: the player's name when we know it, so several open dashboards are easy to tell apart. */
export async function generateMetadata({ params }: PageProps<"/v/[tag]">): Promise<Metadata> {
  const tag = normalizeTag((await params).tag);
  if (!tag) return { title: "Village not found | ClashSync" };
  const name = await getVillageName(tag).catch(() => null);
  return { title: `${name ?? tag} | ClashSync` };
}

export default function VillagePage({ params, searchParams }: PageProps<"/v/[tag]">) {
  return (
    <>
      {/* "Update timers" lives on the dashboard itself (owners only) */}
      <SubpageHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          {Promise.all([params, searchParams]).then(([{ tag }, query]) => (
            <Village slug={tag} justSynced={syncedFrom(query)} />
          ))}
        </Suspense>
      </main>
    </>
  );
}

/** `?synced=N[&linked=1]` is added by the home page right after a sync. */
function syncedFrom(query: Record<string, string | string[] | undefined>): JustSynced | null {
  const n = Number(query.synced);
  if (typeof query.synced !== "string" || !Number.isInteger(n) || n < 0) return null;
  return { upgrades: n, linked: query.linked === "1" };
}

async function Village({ slug, justSynced }: { slug: string; justSynced: JustSynced | null }) {
  const tag = normalizeTag(slug);
  if (!tag) notFound();

  // Canonical URL: uppercase, no '#', O→0
  if (tagToSlug(tag) !== slug) redirect(`/v/${tagToSlug(tag)}`);

  const loaded = await getVillage(tag);

  if (!loaded) {
    return (
      <Card tone="wood" className="p-6 sm:p-10 text-center space-y-4">
        <Heading as="h1" size="lg">
          <span className="text-gold-300">{tag}</span> hasn&apos;t been synced yet
        </Heading>
        <p className="text-sm font-semibold text-cream/90 max-w-md mx-auto">
          Paste your village export on the home page and your upgrades will show up here.
        </p>
        <Link href="/#sync" className={buttonClass({ size: "lg" })}>
          Sync my village
        </Link>
      </Card>
    );
  }

  const { village, ownership } = loaded;
  const access = await getVillageAccess(ownership);
  const state: OwnershipState = access.isOwner
    ? "account_owner"
    : ownership.ownerId
      ? "claimed_other"
      : "unclaimed";

  return (
    <div className="space-y-6">
      {justSynced && <SyncedBanner {...justSynced} />}
      <LiveDashboard
        village={village}
        isOwner={access.isOwner}
        canEdit={access.canEdit}
        ownership={{ state, loggedIn: access.viewer !== null, dmAvailable: isDmConfigured() }}
        profile={
          <Suspense fallback={null}>
            <PlayerProfile
              tag={village.playerTag}
              stored={{ playerName: village.playerName, townHallLevel: village.townHallLevel }}
            />
          </Suspense>
        }
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading village">
      <div className="panel-wood h-24 opacity-70" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel-stone h-28" />
        ))}
      </div>
      <div className="panel-stone h-28" />
      <div className="panel-stone h-64" />
    </div>
  );
}
