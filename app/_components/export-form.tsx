"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ClipboardPaste, Loader2, Lock, RotateCcw, Smartphone } from "lucide-react";
import { parseVillageExport } from "@/lib/parser";
import { SAMPLE_TAG } from "@/lib/sample-data";
import { normalizeTag } from "@/lib/tags";
import { ErrorNotice } from "@/app/_home/notices";
import { Button } from "./ui/button";

const NOT_AN_EXPORT =
  "That doesn't look like a village export. In the game, tap Export Village data → Copy again, then paste the whole thing here.";

/**
 * Paste box for a village export: checks it locally, saves it, then opens that
 * village's dashboard (with `?synced=N` so it shows a confirmation).
 * Used on the home page and, with `expectedTag`, to update a dashboard in place.
 */
export function ExportForm({
  expectedTag,
  onSynced,
  submitLabel = "Sync village",
}: {
  /** Only accept exports for this village ("#XXXX"). */
  expectedTag?: string;
  /** Called once the dashboard has loaded the new data. */
  onSynced?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const navigated = useRef(false);

  // The transition ends when the dashboard has rendered the fresh data
  useEffect(() => {
    if (navigated.current && !isNavigating) {
      navigated.current = false;
      setIsSaving(false);
      setJsonInput("");
      onSynced?.();
    }
  }, [isNavigating, onSynced]);

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

    const exportTag = normalizeTag(local.playerTag);
    if (expectedTag && exportTag && exportTag !== expectedTag) {
      setError(
        `This export is for ${exportTag}, not ${expectedTag}. Copy the export from the right account, or track ${exportTag} from the home page.`
      );
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
        navigated.current = true;
        startTransition(() => router.push(`${data.dashboardPath}?${params}`));
        return;
      }
      setError(data.error || "We couldn't save your village. Try again.");
    } catch {
      setError("Couldn't reach ClashSync. Check your connection and try again.");
    }
    setIsSaving(false);
  };

  const busy = isSaving || isNavigating;

  return (
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
            <Button
              size="sm"
              variant="stone"
              onClick={() => {
                setJsonInput("");
                setFeedback(null);
                setError(null);
              }}
            >
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
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

        <Button size="lg" onClick={handleSync} disabled={!jsonInput.trim() || busy}>
          {busy ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <span>{submitLabel}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>

      {error && <ErrorNotice message={error} />}
    </div>
  );
}

/** Collapsible step-by-step for finding the export in the game. */
export function ExportGuide() {
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
