"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { authClient, signInWithDiscord } from "@/lib/auth-client";
import { Button, buttonClass } from "./ui/button";

/** Discord login button, or the logged-in person's avatar + My villages + log out. */
export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (isPending) return <div className="h-8 w-28 rounded-[0.6rem] border-2 border-black/50 bg-night-800 animate-pulse" aria-hidden />;

  if (!session) {
    return <DiscordLoginButton />;
  }

  const { name, image } = session.user;
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/villages"
        className={buttonClass({ variant: "stone", size: "sm", className: "max-w-44" })}
      >
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar
          <img src={image} alt="" className="w-5 h-5 rounded-full border-[1.5px] border-ink" />
        )}
        <span className="hidden sm:inline max-w-32 truncate">{name}</span>
        <span className="sm:hidden">My villages</span>
      </Link>
      <Button
        variant="stone"
        size="sm"
        iconOnly
        title="Log out"
        aria-label="Log out"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await authClient.signOut();
          setBusy(false);
          router.refresh();
        }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      </Button>
    </div>
  );
}

/** `next`: where to land after login; defaults to the current page. */
export function DiscordLoginButton({ next, label = "Log in with Discord" }: { next?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="discord"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { error } = await signInWithDiscord(next ?? window.location.pathname);
        // On success the browser navigates to Discord; only errors land here
        if (error) setBusy(false);
      }}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {label}
    </Button>
  );
}
