import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getVillage } from "@/lib/village";
import { getVillageAccess } from "@/lib/ownership";
import { isDmConfigured } from "@/lib/discord";
import { AccountMenu } from "@/app/_components/account-menu";
import type { OwnershipState } from "./ownership-card";
import { normalizeTag, tagToSlug } from "@/lib/tags";
import { LiveDashboard } from "./live-dashboard";

export default function VillagePage({ params }: PageProps<"/v/[tag]">) {
  return (
    <>
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            ClashSync
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Re-sync village</span>
              <span className="sm:hidden">Re-sync</span>
            </Link>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">{tag} hasn&apos;t been synced yet</h1>
        <p className="text-sm text-slate-400">
          Paste your village export on the home page and your upgrades will show up here.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition"
        >
          Sync my village
        </Link>
      </section>
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
      <div className="h-8 w-56 rounded-lg bg-slate-800/80" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-900/80 border border-slate-800" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800" />
    </div>
  );
}
