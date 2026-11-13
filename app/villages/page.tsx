import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { getOwnedVillages } from "@/lib/village";
import { SubpageHeader } from "@/app/_components/subpage-header";
import { Heading } from "@/app/_components/ui/card";
import { LoggedOutView, NoVillagesView, VillageListView } from "./village-list-views";

export const metadata = { title: "My villages | ClashSync" };

export default function VillagesPage() {
  return (
    <>
      <SubpageHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <Heading as="h1" size="lg">My villages</Heading>
        <Suspense
          fallback={<div className="panel-stone h-40 animate-pulse" aria-busy="true" aria-label="Loading villages" />}
        >
          <VillageList />
        </Suspense>
      </main>
    </>
  );
}

async function VillageList() {
  const viewer = await getSessionUser();
  if (!viewer) {
    return <LoggedOutView />;
  }

  const villages = await getOwnedVillages(viewer.id);
  if (villages.length === 0) {
    return <NoVillagesView />;
  }

  return <VillageListView villages={villages} />;
}
