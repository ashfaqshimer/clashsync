"use client";

import { useState } from "react";
import {
  Hammer,
  FlaskConical,
  PawPrint,
  FileCode2,
  ClipboardPaste,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Wrench,
  Zap,
  Search,
  Shield,
  Loader2,
} from "lucide-react";
import { parseVillageExport } from "@/lib/parser";
import { SAMPLE_VILLAGE_JSON } from "@/lib/sample-data";
import { ParseResult } from "@/lib/types";
import { ClashPlayerProfile } from "@/lib/clash-api";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"json" | "tag">("json");
  const [jsonInput, setJsonInput] = useState("");
  const [playerTagInput, setPlayerTagInput] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [playerProfile, setPlayerProfile] = useState<ClashPlayerProfile | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
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
          `Village synced! Tracking ${data.totalActiveUpgrades} active upgrades for ${data.playerTag}.`
        );
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
        setSyncNotice(`Loaded tracked upgrades for ${formattedTag}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setApiError(`Lookup failed: ${message}`);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "BUILDER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Hammer className="w-3 h-3" />
            Builder
          </span>
        );
      case "LABORATORY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
            <FlaskConical className="w-3 h-3" />
            Laboratory
          </span>
        );
      case "PET_HOUSE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PawPrint className="w-3 h-3" />
            Pet House
          </span>
        );
      case "BUILDER_BASE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Wrench className="w-3 h-3" />
            Builder Base
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Upgrade
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
              <Hammer className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  Clash<span className="text-amber-400">Sync</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  Live Tracker
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Clash of Clans Village & Queue Tracker
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs between Village Data & Player Tag */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {activeTab === "json" ? (
                  <>
                    <FileCode2 className="w-5 h-5 text-amber-400" />
                    Sync Village
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 text-sky-400" />
                    Player Tag Lookup
                  </>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === "json"
                  ? "Paste your village export data to track all active builders, laboratory research, and pet upgrades."
                  : "Search your player tag to view your village profile and tracked timers."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("json")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  activeTab === "json"
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                Export Data
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tag")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  activeTab === "tag"
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-400"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                Player Tag
              </button>
            </div>
          </div>

          {activeTab === "json" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  In-game: Settings → More Settings → Export Village data → Copy
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Sample</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>

                  {jsonInput && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={7}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste your village export data here (e.g. {"tag": "#R8L9R2GVG", ...})'
                className="w-full p-4 bg-slate-950/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/80 transition"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-500">
                  {copyFeedback ? (
                    <span className="text-amber-400 font-medium">{copyFeedback}</span>
                  ) : (
                    <span>Automatically tracks and calculates exact finish times.</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleParseAndSave}
                  disabled={!jsonInput.trim() || isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing Village...</span>
                    </>
                  ) : (
                    <>
                      <span>Sync Village</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-sm font-bold">
                    #
                  </div>
                  <input
                    type="text"
                    value={playerTagInput}
                    onChange={(e) => setPlayerTagInput(e.target.value)}
                    placeholder="Enter player tag (e.g. R8L9R2GVG or #R8L9R2GVG)"
                    className="w-full pl-9 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleLookupPlayerTag}
                  disabled={!playerTagInput.trim() || isLoadingProfile}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition cursor-pointer"
                >
                  {isLoadingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Lookup Tag</span>
                    </>
                  )}
                </button>
              </div>

              {playerProfile && (
                <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {playerProfile.clan?.badgeUrls?.small && (
                      <img
                        src={playerProfile.clan.badgeUrls.small}
                        alt="Clan Badge"
                        className="w-10 h-10 object-contain"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">
                          {playerProfile.name}
                        </span>
                        <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {playerProfile.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Town Hall {playerProfile.townHallLevel} ·{" "}
                        {playerProfile.clan?.name || "No Clan"} · 🏆{" "}
                        {playerProfile.trophies}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>Verified Supercell Profile</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sync Success Banner */}
        {syncNotice && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 font-medium">{syncNotice}</div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
              Synced
            </span>
          </div>
        )}

        {/* Error Banner */}
        {apiError && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">Notice</p>
              <p className="mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* Active Upgrades Result View */}
        {parseResult && parseResult.success && (
          <section className="space-y-4">
            {/* Summary Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Player Tag
                </p>
                <p className="text-sm font-bold text-white font-mono">
                  {parseResult.playerTag || "N/A"}
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Export Snapshot
                </p>
                <p className="text-sm font-semibold text-slate-300">
                  {parseResult.formattedExportTime || "Just now"}
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Home Village
                </p>
                <p className="text-sm font-bold text-amber-400">
                  {parseResult.builderUpgradesCount} Builders · {parseResult.labUpgradesCount} Lab · {parseResult.petUpgradesCount} Pet
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Builder Base
                </p>
                <p className="text-sm font-bold text-sky-400">
                  {parseResult.builderBaseUpgradesCount} Active
                </p>
              </div>
            </div>

            {/* Parsed Active Upgrades Table / List */}
            {parseResult.upgrades.length > 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Active Upgrades ({parseResult.totalActiveUpgrades})</span>
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Sorted by finish time
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {parseResult.upgrades.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white">
                              {item.name}
                            </h3>
                            {getCategoryBadge(item.category)}
                            {item.isGoblinOrHelper && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Zap className="w-2.5 h-2.5" />
                                Extra Slot / Goblin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">
                            Level: {item.currentLevel} →{" "}
                            <span className="text-amber-400 font-semibold">
                              Level {item.targetLevel}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right pl-10 sm:pl-0 space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.formattedRemaining}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Finishes: {item.formattedFinishTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-900/30 space-y-2">
                <p className="text-sm font-medium text-slate-300">
                  No active upgrades found in this village snapshot.
                </p>
                <p className="text-xs text-slate-500">
                  All builders, laboratory research, and pet houses appear to be idle.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-600 mt-auto">
        <p>
          ClashSync — Unofficial Clash of Clans companion tool.
        </p>
      </footer>
    </div>
  );
}
