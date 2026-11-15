"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { DiscordLoginButton } from "@/app/_components/account-menu";
import { IconChip } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card as Panel, Heading } from "@/app/_components/ui/card";
import { Hint } from "@/app/_components/ui/hint";

export type OwnershipState =
  /** Linked to the viewer's account. */
  | "account_owner"
  /** Nobody has claimed it. */
  | "unclaimed"
  /** Linked to someone else's account. */
  | "claimed_other";

export interface OwnershipView {
  state: OwnershipState;
  loggedIn: boolean;
  /** The server can send Discord DMs (bot configured). */
  dmAvailable: boolean;
}

export function OwnershipCard({ tag, ownership }: { tag: string; ownership: OwnershipView }) {
  const { state, loggedIn } = ownership;

  // Linked to the viewer: the dashboard heading shows a "Linked to you" badge instead
  if (state === "account_owner") return null;

  if (state === "unclaimed") {
    return (
      <Card icon={<IconChip tone="sky"><Shield /></IconChip>} title="Is this your village?">
        {loggedIn ? (
          <>
            Sync it while you&apos;re logged in and it&apos;s linked to your account, so nobody else
            can overwrite your timers.{" "}
            <Link href="/#sync" className="font-extrabold text-sky underline decoration-2 underline-offset-2 hover:text-cream">
              Sync now
            </Link>
          </>
        ) : (
          <>
            Log in with Discord, then sync it, and it&apos;s yours: nobody else can overwrite your
            timers, and you can get alerts when upgrades finish.
            <div className="mt-3">
              <DiscordLoginButton />
            </div>
          </>
        )}
      </Card>
    );
  }

  // Claimed by someone else: the API token settles it
  return (
    <Card
      icon={<IconChip tone="sky"><Shield /></IconChip>}
      title="Linked to another account"
    >
      If {tag} is yours, take it over with the API token from your game{" "}
      <Hint label="API token">
        A short code the game shows only to whoever is logged in to the account, so it proves the village
        is yours. It changes often, so copy a fresh one right before you paste it. It can&apos;t be used
        to log in or change anything in your game.
      </Hint>
      . It moves the village to your account. In-game: Settings → More Settings → API Token → Show, then
      copy.
      <div className="mt-3">
        {loggedIn ? <TakeoverForm tag={tag} /> : <DiscordLoginButton label="Log in to take it over" />}
      </div>
    </Card>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1 min-w-0">
          <Heading size="sm">{title}</Heading>
          <div className="text-sm font-semibold text-muted mt-1.5">{children}</div>
        </div>
      </div>
    </Panel>
  );
}

function TakeoverForm({ tag }: { tag: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/village/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken("");
        router.refresh();
      } else {
        setError(data.error ?? "Verification failed.");
      }
    } catch {
      setError("Couldn't reach ClashSync. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your API token"
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          aria-label="API token"
          className="field h-10 px-3 font-mono text-sm sm:flex-1"
        />
        <Button type="submit" variant="blue" disabled={pending || !token.trim()}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Take over
        </Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm font-bold text-[#ff8a80]">{error}</p>}
    </>
  );
}
