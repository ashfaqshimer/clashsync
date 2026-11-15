import Link from "next/link";
import { SubpageHeader } from "@/app/_components/subpage-header";
import { buttonClass } from "@/app/_components/ui/button";
import { SiteFooter } from "@/app/_home/site-header";
import { DemoDashboard } from "./demo-dashboard";

export const metadata = {
  title: "Live demo | ClashSync",
  description: "See what ClashSync shows for a Clash of Clans village: live upgrade timers, idle builders, potions and Discord alerts.",
};

export default function DemoPage() {
  return (
    <>
      <SubpageHeader
        actions={
          <Link href="/#sync" className={buttonClass({ size: "sm", className: "max-[400px]:hidden" })}>
            Track my village
          </Link>
        }
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <DemoDashboard />
      </main>
      <SiteFooter />
    </>
  );
}
