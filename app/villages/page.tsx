import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getOwnedVillages } from "@/lib/village";
import { tagToSlug } from "@/lib/tags";
import { AccountMenu, DiscordLoginButton } from "@/app/_components/account-menu";
import { VillageTimes } from "./village-times";

export const metadata = { title: "My villages | ClashSync" };

export default function VillagesPage() {
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
          <AccountMenu />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">My villages</h1>
        <Suspense fallback={<div className="h-40 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />}>
          <VillageList />
        </Suspense>
      </main>
    </>
  );
}

async function VillageList() {
  const viewer = await getSessionUser();
  if (!viewer) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-3">
        <p className="text-sm text-slate-300">Log in to see the villages linked to your account.</p>
        <DiscordLoginButton next="/villages" />
      </section>
    );
  }

  const villages = await getOwnedVillages(viewer.id);
  if (villages.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-3">
        <p className="text-sm text-slate-300">No villages linked yet.</p>
        <p className="text-xs text-slate-500">
          Sync a village export while you&apos;re logged in and it&apos;s linked to your account.
        </p>
        <AddVillageLink />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <ul className="rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/70 overflow-hidden">
        {villages.map((v) =>
          v.playerTag ? (
            <li key={v.playerTag}>
              <Link
                href={`/v/${tagToSlug(v.playerTag)}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-slate-800/40 transition"
              >
                <div>
                  <p className="text-sm font-bold font-mono text-white">{v.playerTag}</p>
                  <VillageTimes
                    activeUpgrades={v.activeUpgrades}
                    nextFinishTime={v.nextFinishTime}
                    lastExportTimestamp={v.lastExportTimestamp}
                  />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </li>
          ) : null
        )}
      </ul>
      <AddVillageLink />
    </section>
  );
}

function AddVillageLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition"
    >
      <Plus className="w-3.5 h-3.5" />
      Sync a village
    </Link>
  );
}
