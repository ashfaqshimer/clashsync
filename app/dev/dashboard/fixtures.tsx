"use client";

import type { ReactNode } from "react";
import type { VillageSnapshot, VillageUpgrade } from "@/lib/village";
import { LiveDashboard } from "@/app/v/[tag]/live-dashboard";
import { useNow } from "@/app/v/[tag]/use-now";

/** Every dashboard state, rendered by the real components with fake data (times relative to the client clock). */

function up(
  id: string,
  name: string,
  category: VillageUpgrade["category"],
  inSeconds: number,
  now: number,
  extra: Partial<VillageUpgrade> = {}
): VillageUpgrade {
  return {
    id,
    name,
    category,
    villageType: category === "BUILDER_BASE" ? "BUILDER_BASE" : "HOME",
    currentLevel: 10,
    targetLevel: 11,
    currentFinishTime: now + inSeconds,
    isGearUp: false,
    isExtraSlot: false,
    ...extra,
  };
}

function base(now: number): VillageSnapshot {
  return {
    playerTag: "#2PP0JQ9V",
    lastExportTimestamp: now - 40 * 60,
    builderCount: 6,
    isVerified: true,
    isClaimed: true,
    webhookAlerts: true,
    dmAlerts: true,
    alertLeadMinutes: 5,
    builderBoostEndsAt: null,
    labBoostEndsAt: now + 38 * 60,
    undoableBoost: { kind: "RESEARCH_POTION", createdAt: new Date(0).toISOString() },
    upgrades: [
      up("aq", "Archer Queen", "BUILDER", -120, now, { currentLevel: 86, targetLevel: 87 }),
      up("it", "Inferno Tower", "BUILDER", 3 * 3600 + 1111, now, { currentLevel: 9, targetLevel: 10 }),
      up("ea", "Eagle Artillery", "BUILDER", 2 * 86400 + 5 * 3600, now, { currentLevel: 5, targetLevel: 6 }),
      up("es", "Elixir Storage", "BUILDER", 7 * 3600, now, { isExtraSlot: true }),
      up("ed", "Electro Dragon", "LABORATORY", 86400 + 4 * 3600 + 18 * 60, now, { currentLevel: 5, targetLevel: 6 }),
      up("hs", "Healing Spell", "LABORATORY", 11 * 3600, now, { isExtraSlot: true }),
      up("mt", "Mega Tesla", "BUILDER_BASE", 3 * 3600 + 7 * 60, now),
      up("bm", "Battle Machine", "BUILDER_BASE", 16 * 3600, now, { currentLevel: 30, targetLevel: 31 }),
    ],
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3" data-state={title}>
      <h2 className="label-caps !text-sky border-b-2 border-sky/30 pb-1">{title}</h2>
      {children}
    </section>
  );
}

export function DashboardFixtures() {
  const now = useNow();
  if (now === null) return null;
  const b = base(now);

  return (
    <div className="space-y-16">
      <Section title="Owner · builders idle, lab boosted, alerts on, undo available, one done">
        <LiveDashboard
          village={b}
          isOwner
          canEdit
          ownership={{ state: "account_owner", loggedIn: true, dmAvailable: true }}
        />
      </Section>

      <Section title="Unclaimed · logged out · stale export · builder count unknown · nothing to boost in lab">
        <LiveDashboard
          village={{
            ...b,
            lastExportTimestamp: now - 30 * 3600,
            builderCount: null,
            labBoostEndsAt: null,
            undoableBoost: null,
            upgrades: b.upgrades.filter((u) => u.category !== "LABORATORY"),
          }}
          isOwner={false}
          canEdit
          ownership={{ state: "unclaimed", loggedIn: false, dmAvailable: true }}
        />
      </Section>

      <Section title="Unclaimed · logged in">
        <LiveDashboard
          village={{ ...b, undoableBoost: null }}
          isOwner={false}
          canEdit
          ownership={{ state: "unclaimed", loggedIn: true, dmAvailable: true }}
        />
      </Section>

      <Section title="Another account's village · logged in (takeover form) · read-only potions">
        <LiveDashboard
          village={{ ...b, undoableBoost: null, labBoostEndsAt: null }}
          isOwner={false}
          canEdit={false}
          ownership={{ state: "claimed_other", loggedIn: true, dmAvailable: true }}
        />
      </Section>

      <Section title="Another account's village · logged out">
        <LiveDashboard
          village={{ ...b, undoableBoost: null }}
          isOwner={false}
          canEdit={false}
          ownership={{ state: "claimed_other", loggedIn: false, dmAvailable: true }}
        />
      </Section>

      <Section title="Owner · no upgrades · alerts off · DMs not configured · all builders free">
        <LiveDashboard
          village={{
            ...b,
            webhookAlerts: false,
            dmAlerts: false,
            alertLeadMinutes: 0,
            labBoostEndsAt: null,
            undoableBoost: null,
            upgrades: [],
          }}
          isOwner
          canEdit
          ownership={{ state: "account_owner", loggedIn: true, dmAvailable: false }}
        />
      </Section>
    </div>
  );
}
