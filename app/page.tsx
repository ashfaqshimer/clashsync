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
} from "lucide-react";
import { parseVillageExport } from "@/lib/parser";
import { SAMPLE_VILLAGE_JSON } from "@/lib/sample-data";
import { ParseResult } from "@/lib/types";

export default function Home() {
  const [jsonInput, setJsonInput] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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
    setCopyFeedback("Sample village JSON loaded!");
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleClear = () => {
    setJsonInput("");
    setParseResult(null);
    setCopyFeedback(null);
  };

  const handleParse = () => {
    const result = parseVillageExport(jsonInput);
    setParseResult(result);
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
                  Phase 1: Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Clash of Clans Village JSON Parser
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Phase 1: Ingestion Input Card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-amber-400" />
                Export Village JSON Ingestion
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Paste your village data exported from Clash of Clans (Settings → More Settings → Data Export → Copy).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample JSON</span>
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

          <div className="relative">
            <textarea
              rows={7}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste raw JSON export here (e.g. {"tag": "#9PR8Y2QL", "timestamp": 1731317000, "buildings": [...]})'
              className="w-full p-4 bg-slate-950/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/80 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-500">
              {copyFeedback ? (
                <span className="text-amber-400 font-medium">{copyFeedback}</span>
              ) : (
                <span>Extracts active builders, laboratory, and pet timers.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleParse}
              disabled={!jsonInput.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Parse & Calculate Timers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Phase 1 Result View */}
        {parseResult && (
          <section className="space-y-4">
            {parseResult.success ? (
              <div className="space-y-4">
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
                      Export Timestamp
                    </p>
                    <p className="text-sm font-semibold text-slate-300">
                      {parseResult.formattedExportTime || "Just now"}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      Active Builders
                    </p>
                    <p className="text-sm font-bold text-amber-400">
                      {parseResult.builderUpgradesCount} busy
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      Lab / Pets Active
                    </p>
                    <p className="text-sm font-bold text-slate-200">
                      {parseResult.labUpgradesCount} Lab · {parseResult.petUpgradesCount} Pet
                    </p>
                  </div>
                </div>

                {/* Parsed Active Upgrades Table / List */}
                {parseResult.upgrades.length > 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Active Upgrades Found ({parseResult.totalActiveUpgrades})</span>
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
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                <div>
                  <p className="font-semibold text-rose-200">Parsing Failed</p>
                  <p className="mt-0.5">{parseResult.error}</p>
                </div>
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
