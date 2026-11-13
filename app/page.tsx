"use client";

import { useState } from "react";
import { FileCode2, Search } from "lucide-react";
import { formatDuration, parseVillageExport } from "@/lib/parser";
import { SAMPLE_TAG, SAMPLE_VILLAGE_JSON } from "@/lib/sample-data";
import { ParseResult } from "@/lib/types";
import { ClashPlayerProfile } from "@/lib/clash-api";
import { ExportTab } from "./_home/export-tab";
import { ErrorNotice, SyncNotice } from "./_home/notices";
import { SiteFooter, SiteHeader } from "./_home/site-header";
import { TagLookupTab } from "./_home/tag-lookup-tab";
import { UpgradeResults } from "./_home/upgrade-results";
import { IconChip } from "./_components/ui/badge";
import { Button } from "./_components/ui/button";
import { Card, Heading } from "./_components/ui/card";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"json" | "tag">("json");
  const [jsonInput, setJsonInput] = useState("");
  const [playerTagInput, setPlayerTagInput] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [playerProfile, setPlayerProfile] = useState<ClashPlayerProfile | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [dashboardPath, setDashboardPath] = useState<string | null>(null);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      setCopyFeedback("Pasted from clipboard!");
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback("Clipboard access denied. Please paste manually.");
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleLoadSample = () => {
    setJsonInput(SAMPLE_VILLAGE_JSON);
    setCopyFeedback("Sample village loaded!");
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleClear = () => {
    setJsonInput("");
    setParseResult(null);
    setCopyFeedback(null);
    setSyncNotice(null);
    setApiError(null);
  };

  // Parse local preview & sync village
  const handleParseAndSave = async () => {
    setApiError(null);
    setSyncNotice(null);

    // 1. Client-side parse first for instant UI response
    const localResult = parseVillageExport(jsonInput);
    setParseResult(localResult);

    if (!localResult.success) {
      return;
    }

    // The sample is preview-only so it can never overwrite a real village
    if (localResult.playerTag === SAMPLE_TAG) {
      setDashboardPath(null);
      setSyncNotice(
        "This is a sample village preview and wasn't saved. Paste your own export to track your village."
      );
      return;
    }

    // 2. Persist to storage via API
    setIsSaving(true);
    try {
      const res = await fetch("/api/village/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: jsonInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncNotice(
          `Village synced! Tracking ${data.totalActiveUpgrades} active upgrades for ${data.playerTag}.${
            data.claimed ? " It's now linked to your account." : ""
          }`
        );
        setDashboardPath(data.dashboardPath ?? null);
      } else {
        setApiError(data.error || "Failed to sync village");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setApiError(`Unable to sync village right now: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Lookup player tag via official API and load saved upgrades
  const handleLookupPlayerTag = async () => {
    if (!playerTagInput.trim()) return;

    setIsLoadingProfile(true);
    setApiError(null);
    setPlayerProfile(null);
    setLookupNote(null);
    setSyncNotice(null);

    const cleanTag = playerTagInput.trim().replace(/^#/, "");
    const formattedTag = `#${cleanTag}`;

    try {
      // 1. Fetch public profile from Supercell API endpoint
      const profileRes = await fetch(`/api/player/${encodeURIComponent(formattedTag)}`);
      const profileData = await profileRes.json();

      if (profileData.success && profileData.player) {
        setPlayerProfile(profileData.player);
      } else if (profileData.isKeyMissing) {
        setCopyFeedback(profileData.error);
      } else if (profileData.error) {
        setApiError(profileData.error);
      }

      // 2. Fetch saved active upgrades for this tag
      const dbRes = await fetch(`/api/village/upgrades?tag=${encodeURIComponent(formattedTag)}`);
      const dbData = await dbRes.json();

      if (dbRes.ok && dbData.success) {
        setParseResult({
          success: true,
          playerTag: dbData.playerTag,
          exportTimestamp: dbData.lastExportTimestamp,
          formattedExportTime: new Date(dbData.lastExportTimestamp * 1000).toLocaleString(
            undefined,
            { dateStyle: "medium", timeStyle: "short" }
          ),
          totalActiveUpgrades: dbData.totalActiveUpgrades,
          builderUpgradesCount: dbData.upgrades.filter(
            (u: { category: string }) => u.category === "BUILDER"
          ).length,
          labUpgradesCount: dbData.upgrades.filter(
            (u: { category: string }) => u.category === "LABORATORY"
          ).length,
          petUpgradesCount: dbData.upgrades.filter(
            (u: { category: string }) => u.category === "PET_HOUSE"
          ).length,
          builderBaseUpgradesCount: dbData.upgrades.filter(
            (u: { category: string }) => u.category === "BUILDER_BASE"
          ).length,
          upgrades: dbData.upgrades,
        });
        setDashboardPath(`/v/${String(dbData.playerTag).replace(/^#/, "")}`);
        const ageSeconds = dbData.lastExportTimestamp
          ? Math.floor(Date.now() / 1000) - dbData.lastExportTimestamp
          : null;
        setSyncNotice(
          `Showing upgrades from your last export${
            ageSeconds !== null ? `, ${formatDuration(ageSeconds)} ago` : ""
          }.`
        );
        setLookupNote(
          "Looking up a tag can't fetch new timers, because Clash of Clans only shares them through the village export. Paste a fresh export in the Export Data tab to update them."
        );
      } else if (dbRes.status === 404) {
        setParseResult(null);
        setLookupNote(
          "No upgrades tracked for this tag yet. Paste your village export in the Export Data tab to start tracking."
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setApiError(`Lookup failed: ${message}`);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Navigation Tabs between Village Data & Player Tag */}
        <Card tone="wood" className="p-4 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {activeTab === "json" ? (
                <IconChip size="lg">
                  <FileCode2 />
                </IconChip>
              ) : (
                <IconChip size="lg" tone="sky">
                  <Search />
                </IconChip>
              )}
              <div className="min-w-0">
                <Heading as="h1" size="lg">
                  {activeTab === "json" ? "Sync Village" : "Player Tag Lookup"}
                </Heading>
                <p className="text-sm text-cream/80 mt-1.5">
                  {activeTab === "json"
                    ? "Paste your village export data to track all active builders, laboratory research, and pet upgrades."
                    : "Search your player tag to view your village profile and tracked timers."}
                </p>
              </div>
            </div>

            <div role="tablist" aria-label="How to load your village" className="well flex shrink-0 items-center gap-1 p-1.5 self-start">
              <Button
                role="tab"
                aria-selected={activeTab === "json"}
                size="sm"
                variant={activeTab === "json" ? "gold" : "ghost"}
                className={activeTab === "json" ? undefined : "mb-1 text-cream/70 hover:text-cream"}
                onClick={() => setActiveTab("json")}
              >
                Export Data
              </Button>

              <Button
                role="tab"
                aria-selected={activeTab === "tag"}
                size="sm"
                variant={activeTab === "tag" ? "blue" : "ghost"}
                className={activeTab === "tag" ? undefined : "mb-1 text-cream/70 hover:text-cream"}
                onClick={() => setActiveTab("tag")}
              >
                Player Tag
              </Button>
            </div>
          </div>

          {activeTab === "json" ? (
            <ExportTab
              jsonInput={jsonInput}
              onJsonInputChange={setJsonInput}
              copyFeedback={copyFeedback}
              isSaving={isSaving}
              onLoadSample={handleLoadSample}
              onPasteClipboard={handlePasteClipboard}
              onClear={handleClear}
              onSync={handleParseAndSave}
            />
          ) : (
            <TagLookupTab
              playerTagInput={playerTagInput}
              onPlayerTagInputChange={setPlayerTagInput}
              isLoadingProfile={isLoadingProfile}
              onLookup={handleLookupPlayerTag}
              playerProfile={playerProfile}
              lookupNote={lookupNote}
            />
          )}
        </Card>

        {syncNotice && <SyncNotice message={syncNotice} dashboardPath={dashboardPath} />}

        {apiError && <ErrorNotice message={apiError} />}

        {parseResult && parseResult.success && <UpgradeResults result={parseResult} />}
      </main>

      <SiteFooter />
    </div>
  );
}
