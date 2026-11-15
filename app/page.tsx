import { Suspense } from "react";
import { Faq } from "./_home/faq";
import { Features } from "./_home/features";
import { FindByTag } from "./_home/find-by-tag";
import { Hero } from "./_home/hero";
import { HowItWorks } from "./_home/how-it-works";
import { SiteFooter, SiteHeader } from "./_home/site-header";
import { SyncPanel } from "./_home/sync-panel";
import { FindByTagUnlessListed, HomeTop } from "./_home/welcome-back";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16">
        {/* The hero is the static shell; logged-in players with villages get their list instead */}
        <Suspense fallback={<Hero />}>
          <HomeTop />
        </Suspense>

        <HowItWorks />

        <section aria-label="Sync your village" className="mx-auto max-w-3xl space-y-4">
          <SyncPanel />
          <Suspense fallback={<FindByTag />}>
            <FindByTagUnlessListed />
          </Suspense>
        </section>

        <Features />

        <div className="mx-auto max-w-3xl">
          <Faq />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
