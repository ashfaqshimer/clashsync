"use client";

import type { ReactNode } from "react";
import { Heading } from "@/app/_components/ui/card";
import { LoggedOutView, NoVillagesView, VillageListView } from "@/app/villages/village-list-views";
import { WelcomeBack } from "@/app/_home/welcome-back-view";
import { useFixtureVillages } from "./fixtures";

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="label-caps !text-sky border-b-2 border-sky/30 pb-1">{label}</h2>
      {children}
    </section>
  );
}

/** "My villages" list states plus the home page welcome-back block. */
export function VillageListStates() {
  const fixtures = useFixtureVillages();
  if (!fixtures) return null;
  const states: Array<[string, ReactNode]> = [
    ["List · idle builders, all busy, stale export, nothing upgrading (attention first)", <VillageListView key="list" villages={fixtures.list} />],
    ["No villages", <NoVillagesView key="empty" />],
    ["Logged out", <LoggedOutView key="out" />],
    ["Loading", <div key="loading" className="panel-stone h-40 animate-pulse" />],
  ];
  return (
    <>
      {states.map(([label, view]) => (
        <Section key={label} label={label}>
          <Heading as="p" size="lg">My villages</Heading>
          {view}
        </Section>
      ))}
      <Section label="Home page · welcome back (logged in, has villages)"><WelcomeBack name="Chief Ada" villages={fixtures.welcome} /></Section>
    </>
  );
}
