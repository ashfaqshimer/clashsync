"use client";

import type { ReactNode } from "react";
import { BellRing, Check, Link2, ListChecks, Lock } from "lucide-react";
import { DiscordLoginButton } from "@/app/_components/account-menu";
import { Badge, IconChip } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card, CardHeader } from "@/app/_components/ui/card";
import type { OwnershipView } from "./ownership-card";

/**
 * Getting-started steps for someone who can edit this village. Disappears once
 * the village is linked to their account and alerts are on.
 */
export function SetupChecklist({
  ownership,
  alertsOn,
  onUpdate,
}: {
  ownership: OwnershipView;
  alertsOn: boolean;
  /** Opens the update panel (a logged-in sync links the village). */
  onUpdate: () => void;
}) {
  const linked = ownership.state === "account_owner";
  // Alerts belong to the linked account, so they only count once the village is linked
  const alerts = linked && alertsOn;
  if (ownership.state === "claimed_other" || alerts) return null;

  const doneCount = 1 + (linked ? 1 : 0);

  return (
    <Card aria-labelledby="setup-title" className="p-4 sm:p-5 space-y-3">
      <CardHeader
        icon={
          <IconChip tone="sky" size="sm">
            <ListChecks />
          </IconChip>
        }
        title={<span id="setup-title">Get the most out of ClashSync</span>}
        actions={<Badge tone="sky">{doneCount} of 3 done</Badge>}
      />
      <ol className="grid gap-2 md:grid-cols-3">
        <Step n={1} done title="Village synced" body="Your timers are counting down live." />
        <Step
          n={2}
          done={linked}
          icon={<Link2 />}
          title="Link it to your account"
          body={
            linked
              ? "Only you can update this village."
              : ownership.loggedIn
              ? "Paste a fresh export while you're logged in. Then only you can update it."
              : "Log in with Discord, then paste your export again. Then only you can update it."
          }
          action={
            ownership.loggedIn ? (
              <Button size="sm" onClick={onUpdate}>
                Paste export
              </Button>
            ) : (
              <DiscordLoginButton />
            )
          }
        />
        <Step
          n={3}
          done={false}
          locked={!linked}
          icon={<BellRing />}
          title="Turn on Discord alerts"
          body={
            linked
              ? "Get a DM or a channel post before each upgrade finishes."
              : "Unlocks once the village is linked to your account."
          }
          action={
            linked ? (
              <a href="#alerts" className="btn btn-discord btn-sm">
                Set up alerts
              </a>
            ) : null
          }
        />
      </ol>
    </Card>
  );
}

function Step({
  n,
  done,
  locked,
  icon,
  title,
  body,
  action,
}: {
  n: number;
  done: boolean;
  locked?: boolean;
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <li
      className={`well flex flex-col gap-2 p-3 ${done ? "!border-grass/50" : ""} ${locked ? "opacity-70" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-xs ${
            done ? "bg-grass text-ink" : locked ? "bg-night-700 text-muted" : "bg-gold-400 text-ink"
          }`}
        >
          {done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : locked ? <Lock className="w-3 h-3" /> : n}
        </span>
        <span className={`text-sm font-extrabold ${done ? "text-grass" : "text-cream"}`}>
          <span className="sr-only">
            Step {n}, {done ? "done" : locked ? "locked" : "to do"}:{" "}
          </span>
          {title}
        </span>
        {!done && icon && <span className="ml-auto text-muted [&>svg]:h-4 [&>svg]:w-4" aria-hidden>{icon}</span>}
      </div>
      <p className={`text-xs font-semibold ${done ? "text-muted" : "text-cream/80"}`}>{body}</p>
      {!done && action && <div className="mt-auto pt-1">{action}</div>}
    </li>
  );
}
