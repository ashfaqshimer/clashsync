import { SubpageHeader } from "@/app/_components/subpage-header";
import { DashboardFixtures } from "./fixtures";

export const metadata = { title: "Dashboard states | ClashSync" };

/** Dev-only: dashboard states with fixture data. */
export default function DashboardStates() {
  return (
    <>
      <SubpageHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <DashboardFixtures />
      </main>
    </>
  );
}
