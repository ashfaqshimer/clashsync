import { SubpageHeader } from "@/app/_components/subpage-header";
import { VillageListStates } from "./states";

export const metadata = { title: "My villages states | ClashSync" };

/** Dev-only: "My villages" states with fixture data (times relative to the client clock). */
export default function VillagesStates() {
  return (
    <>
      <SubpageHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
        <VillageListStates />
      </main>
    </>
  );
}
