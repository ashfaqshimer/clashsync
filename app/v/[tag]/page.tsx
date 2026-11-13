import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { getVillage } from "@/lib/village";
import { getVillageAccess } from "@/lib/ownership";
import { isDmConfigured } from "@/lib/discord";
import { SubpageHeader } from "@/app/_components/subpage-header";
import { buttonClass } from "@/app/_components/ui/button";
import { Card, Heading } from "@/app/_components/ui/card";
import type { OwnershipState } from "./ownership-card";
import { normalizeTag, tagToSlug } from "@/lib/tags";
import { LiveDashboard } from "./live-dashboard";

export default function VillagePage({ params }: PageProps<"/v/[tag]">) {
  return (
    <>
      <SubpageHeader
        actions={
          <Link href="/" className={buttonClass({ size: "sm" })}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Re-sync village</span>
            <span className="sm:hidden">Re-sync</span>
          </Link>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          {params.then(({ tag }) => (
            <Village slug={tag} />
          ))}
        </Suspense>
      </main>
    </>
  );
}

async function Village({ slug }: { slug: string }) {
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
        <p className="text-sm font-semibold text-cream/85 max-w-md mx-auto">
          Paste your village export on the home page and your upgrades will show up here.
        </p>
        <Link href="/" className={buttonClass({ size: "lg" })}>
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
    <LiveDashboard
      village={village}
      isOwner={access.isOwner}
      canEdit={access.canEdit}
      ownership={{ state, loggedIn: access.viewer !== null, dmAvailable: isDmConfigured() }}
    />
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
