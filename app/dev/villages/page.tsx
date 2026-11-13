import type { ReactNode } from "react";
import { SubpageHeader } from "@/app/_components/subpage-header";
import { Heading } from "@/app/_components/ui/card";
import { LoggedOutView, NoVillagesView, VillageListView } from "@/app/villages/village-list-views";

export const metadata = { title: "My villages states | ClashSync" };

// Fixed epochs (the server never computes "now"); the relative labels render on the client.
const EXPORTED = 1_794_600_000;
const STATES: Array<[string, ReactNode]> = [
  [
    "List",
    <VillageListView
      key="list"
      villages={[
        { playerTag: "#2PP0JQ9V", activeUpgrades: 9, nextFinishTime: EXPORTED + 3 * 86400, lastExportTimestamp: EXPORTED },
        { playerTag: "#9QQ2LL8Y", activeUpgrades: 1, nextFinishTime: EXPORTED + 5 * 86400, lastExportTimestamp: EXPORTED - 90_000 },
        { playerTag: "#Y0RC8UV2", activeUpgrades: 0, nextFinishTime: null, lastExportTimestamp: null },
      ]}
    />,
  ],
  ["No villages", <NoVillagesView key="empty" />],
  ["Logged out", <LoggedOutView key="out" />],
  ["Loading", <div key="loading" className="panel-stone h-40 animate-pulse" />],
];

/** Dev-only: "My villages" states with fixture data. */
export default function VillagesStates() {
  return (
    <>
      <SubpageHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
        {STATES.map(([label, view]) => (
          <section key={label} className="space-y-6">
            <h2 className="label-caps !text-sky border-b-2 border-sky/30 pb-1">{label}</h2>
            <Heading as="p" size="lg">My villages</Heading>
            {view}
          </section>
        ))}
      </main>
    </>
  );
}
