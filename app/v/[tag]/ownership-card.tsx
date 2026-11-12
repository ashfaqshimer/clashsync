"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, ShieldCheck } from "lucide-react";

export function OwnershipCard({
  tag,
  isOwner,
  isVerified,
}: {
  tag: string;
  isOwner: boolean;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOwner) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-emerald-200">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        You&apos;ve verified this village. Only verified devices can sync {tag}.
      </section>
    );
  }

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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-semibold text-white">
            {isVerified ? "This village is protected" : "Is this your village? Protect it"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isVerified
              ? "Verify with your API token to sync it from this device."
              : "Verify once and nobody else can overwrite your timers. You'll need this before turning on Discord alerts."}{" "}
            In-game: Settings → More Settings → API Token → Show, then copy.
          </p>
        </div>
      </div>

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
          Verify
        </button>
      </form>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </section>
  );
}
