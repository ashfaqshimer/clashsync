"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { authClient, signInWithDiscord } from "@/lib/auth-client";

/** Discord login button, or the logged-in person's avatar + My villages + log out. */
export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (isPending) return <div className="h-8 w-24 rounded-lg bg-slate-800/60 animate-pulse" />;

  if (!session) {
    return <DiscordLoginButton />;
  }

  const { name, image } = session.user;
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/villages"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition"
      >
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar
          <img src={image} alt="" className="w-5 h-5 rounded-full" />
        )}
        <span className="hidden sm:inline max-w-32 truncate">{name}</span>
        <span className="sm:hidden">My villages</span>
      </Link>
      <button
        type="button"
        title="Log out"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await authClient.signOut();
          setBusy(false);
          router.refresh();
        }}
        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      </button>
    </div>
  );
}

/** `next`: where to land after login; defaults to the current page. */
export function DiscordLoginButton({ next, label = "Log in with Discord" }: { next?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { error } = await signInWithDiscord(next ?? window.location.pathname);
        // On success the browser navigates to Discord; only errors land here
        if (error) setBusy(false);
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-60 text-white text-xs font-semibold transition cursor-pointer"
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {label}
    </button>
  );
}
