"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, Loader2, Shield, ShieldCheck } from "lucide-react";
import { DiscordLoginButton } from "@/app/_components/account-menu";

export type OwnershipState =
  /** Linked to the viewer's account. */
  | "account_owner"
  /** Verified on this device before accounts existed, not linked yet. */
  | "legacy_owner"
  /** Nobody has claimed it. */
  | "unclaimed"
  /** Linked to someone else's account. */
  | "claimed_other"
  /** Verified the old way by someone else's device. */
  | "legacy_protected";

export interface OwnershipView {
  state: OwnershipState;
  loggedIn: boolean;
  /** The server can send Discord DMs (bot configured). */
  dmAvailable: boolean;
}

export function OwnershipCard({ tag, ownership }: { tag: string; ownership: OwnershipView }) {
  const { state, loggedIn } = ownership;

  if (state === "account_owner") {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-emerald-200">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        This village is linked to your Discord account. Only you can sync {tag}, from any device.
      </section>
    );
  }

  if (state === "legacy_owner") {
    return (
      <Card icon={<Link2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />} title="Link this village to your account">
        You verified {tag} on this device. Log in with Discord to link it, so you can sync it from
        any device and get alerts as Discord DMs.
        <div className="mt-3">
          <DiscordLoginButton />
        </div>
      </Card>
    );
  }

  if (state === "unclaimed") {
    return (
      <Card icon={<Shield className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />} title="Is this your village?">
        {loggedIn ? (
          <>
            Sync it while you&apos;re logged in and it&apos;s linked to your account, so nobody else
            can overwrite your timers.{" "}
            <Link href="/" className="font-semibold text-sky-300 underline underline-offset-2 hover:text-white">
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

  // Claimed by someone else (or protected the old way): the API token settles it
  return (
    <Card
      icon={<Shield className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
      title={state === "claimed_other" ? "Linked to another account" : "This village is protected"}
    >
      If {tag} is yours, take it over with the API token from your game. It moves the village to your
      account. In-game: Settings → More Settings → API Token → Show, then copy.
      <div className="mt-3">
        {loggedIn ? <TakeoverForm tag={tag} /> : <DiscordLoginButton label="Log in to take it over" />}
      </div>
    </Card>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <div className="text-xs text-slate-400 mt-1">{children}</div>
        </div>
      </div>
    </section>
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
          className="flex-1 px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-lg font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        />
        <button
          type="submit"
          disabled={pending || !token.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-sm font-semibold transition cursor-pointer"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Take over
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </>
  );
}
