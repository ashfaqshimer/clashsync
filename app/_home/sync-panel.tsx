"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  ClipboardPaste,
  FileCode2,
  Loader2,
  Lock,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { parseVillageExport } from "@/lib/parser";
import { SAMPLE_TAG } from "@/lib/sample-data";
import { authClient } from "@/lib/auth-client";
import { DiscordLoginButton } from "@/app/_components/account-menu";
import { IconChip } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card, Heading } from "@/app/_components/ui/card";
import { ErrorNotice } from "./notices";

const NOT_AN_EXPORT =
  "That doesn't look like a village export. In the game, tap Export Village data → Copy again, then paste the whole thing here.";

/** The paste box: validates the export locally, saves it, then opens the live dashboard. */
export function SyncPanel() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [jsonInput, setJsonInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flash = (text: string, ms = 2500) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), ms);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      setError(null);
      flash("Pasted from clipboard!");
    } catch {
      flash("Your browser blocked the Paste button. Long-press (or right-click) the box and paste there.", 4000);
    }
  };

  const handleClear = () => {
    setJsonInput("");
    setFeedback(null);
    setError(null);
  };

  const handleSync = async () => {
    setError(null);

    const local = parseVillageExport(jsonInput);
    if (!local.success || !local.playerTag) {
      setError(NOT_AN_EXPORT);
      return;
    }

    // The sample can never be saved over a real village; show the demo instead
    if (local.playerTag === SAMPLE_TAG) {
      router.push("/demo");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/village/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: jsonInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.dashboardPath) {
        const params = new URLSearchParams({ synced: String(data.totalActiveUpgrades ?? 0) });
        if (data.claimed) params.set("linked", "1");
        // Stay in the "Syncing" state while the dashboard loads
        router.push(`${data.dashboardPath}?${params}`);
        return;
      }
      setError(data.error || "We couldn't save your village. Try again.");
    } catch {
      setError("Couldn't reach ClashSync. Check your connection and try again.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <Card tone="wood" id="sync" className="p-4 sm:p-7 space-y-5">
        <div className="flex items-start gap-3">
          <IconChip size="lg">
            <FileCode2 />
          </IconChip>
          <div className="min-w-0">
            <Heading as="h2" size="lg">
              Track your village
            </Heading>
            <p className="text-sm font-semibold text-cream/90 mt-1.5">
              Paste your village export below. We&apos;ll find every upgrade that&apos;s running and
              open your live dashboard.
            </p>
          </div>
        </div>

        <ExportGuide />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="village-export" className="label-caps !text-cream/90">
              Your village export
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="stone" onClick={handlePaste}>
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </Button>
              {jsonInput && (
                <Button size="sm" variant="stone" onClick={handleClear}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </Button>
              )}
            </div>
          </div>

          <textarea
            id="village-export"
            rows={6}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError(null);
            }}
            placeholder='Paste here. It starts with {"tag":"#…'
            spellCheck={false}
            className="field p-4 font-mono text-xs leading-relaxed"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-xs font-semibold" aria-live="polite">
            {feedback ? (
              <span className="text-gold-200">{feedback}</span>
            ) : (
              <span className="text-cream/90 inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                The export holds levels and timers only, never your password.
              </span>
            )}
          </p>

          <Button size="lg" onClick={handleSync} disabled={!jsonInput.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Syncing village...</span>
              </>
            ) : (
              <>
                <span>Sync village</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {!isPending && !session && (
          <div className="well flex flex-col sm:flex-row sm:items-center gap-3 p-3.5">
            <p className="flex-1 text-sm font-semibold text-cream/85">
              <b className="text-cream">Optional:</b> log in first to link the village to your
              account. Then only you can update it, and you can turn on Discord alerts.
            </p>
            <DiscordLoginButton />
          </div>
        )}
      </Card>

      {error && <ErrorNotice message={error} />}
    </div>
  );
}

/** Collapsible step-by-step for finding the export in the game. */
function ExportGuide() {
  return (
    <details className="group well p-0 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[inherit] px-4 py-3 font-display text-base text-gold-200 transition hover:text-gold-100 focus-visible:outline-3 focus-visible:outline-sky">
        Where do I find my village export?
        <ChevronDown className="w-5 h-5 shrink-0 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-3 border-t-2 border-black/30 px-4 pb-4 pt-3 text-sm font-semibold text-cream/90">
        <ol className="list-decimal space-y-1.5 pl-5 marker:font-display marker:text-gold-300">
          <li>Open Clash of Clans and tap the <b className="text-cream">Settings</b> gear.</li>
          <li>Tap <b className="text-cream">More Settings</b>.</li>
          <li>
            Scroll down to <b className="text-cream">Export Village data</b> and tap{" "}
            <b className="text-cream">Copy</b>.
          </li>
          <li>Come back here and paste it into the box below.</li>
        </ol>
        <p className="flex items-start gap-2 text-cream/80">
          <Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-sky" aria-hidden />
          <span>
            Playing on your phone? Open ClashSync in your phone&apos;s browser so the copied text is
            right there. The export is a built-in game feature and doesn&apos;t include your password or
            login.
          </span>
        </p>
      </div>
    </details>
  );
}
