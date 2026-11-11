"use client";

import { useState } from "react";
import {
  Hammer,
  FlaskConical,
  PawPrint,
  Sparkles,
  Link2,
  FileCode2,
  ClipboardPaste,
  ArrowRight,
  Bell,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"url" | "json">("url");
  const [baseUrl, setBaseUrl] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [pastedStatus, setPastedStatus] = useState<string | null>(null);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (activeTab === "url") {
        setBaseUrl(text);
      } else {
        setJsonContent(text);
      }
      setPastedStatus("Pasted from clipboard!");
      setTimeout(() => setPastedStatus(null), 2500);
    } catch {
      setPastedStatus("Please grant clipboard permission or paste manually.");
      setTimeout(() => setPastedStatus(null), 3000);
    }
  };

  const handleClear = () => {
    if (activeTab === "url") {
      setBaseUrl("");
    } else {
      setJsonContent("");
    }
    setPastedStatus(null);
  };

  // Preview mock items to display how the queue dashboard will look
  const mockBuilders = [
    {
      id: 1,
      name: "Eagle Artillery Lvl 7",
      status: "Upgrading",
      remaining: "1d 14h 32m",
      progress: 68,
      isIdle: false,
    },
    {
      id: 2,
      name: "Archer Queen Lvl 95",
      status: "Upgrading",
      remaining: "2d 04h 10m",
      progress: 45,
      isIdle: false,
    },
    {
      id: 3,
      name: "Scattershot Lvl 5",
      status: "Upgrading",
      remaining: "3d 18h 00m",
      progress: 25,
      isIdle: false,
    },
    {
      id: 4,
      name: "Monolith Lvl 3",
      status: "Upgrading",
      remaining: "4d 09h 45m",
      progress: 15,
      isIdle: false,
    },
    {
      id: 5,
      name: "Idle Builder",
      status: "Available",
      remaining: "--",
      progress: 0,
      isIdle: true,
    },
    {
      id: 6,
      name: "Idle Builder (B.O.B)",
      status: "Available",
      remaining: "--",
      progress: 0,
      isIdle: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
                  v0.1
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Clash of Clans Queue & Timer Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TH17 / TH18 Ready</span>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-[#7983f5] border border-[#5865F2]/30 text-xs font-medium transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Discord Alerts</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Ingestion Section: Paste Base URL / Village Data */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Village Ingestion</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Sync Your Village Queue
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Paste your Clash of Clans base URL or exported village JSON below.
              ClashSync will parse all active construction, laboratory research,
              and pet training queues with live countdowns.
            </p>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 pt-2 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-[1px] cursor-pointer ${
                  activeTab === "url"
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Base URL / Link</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("json")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-[1px] cursor-pointer ${
                  activeTab === "json"
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCode2 className="w-4 h-4" />
                <span>Raw Village JSON</span>
              </button>
            </div>

            {/* Input Controls */}
            {activeTab === "url" ? (
              <div className="space-y-3 pt-2">
                <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="Paste base link (e.g. https://link.clashofclans.com/en/?action=OpenLayout&id=...)"
                      className="w-full pl-10 pr-24 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                    />
                    {baseUrl && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-2 px-2 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                    >
                      <ClipboardPaste className="w-4 h-4 text-amber-400" />
                      <span>Paste</span>
                    </button>

                    <button
                      type="button"
                      disabled={!baseUrl.trim()}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
                    >
                      <span>Sync Village</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Paste your layout link or exported village data
                  </span>
                  {pastedStatus && (
                    <span className="text-amber-400 font-medium animate-fade-in">
                      {pastedStatus}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <textarea
                    rows={5}
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                    placeholder='Paste raw village JSON payload from Supercell export (e.g. {"buildings": [...], "timestamp": ...})'
                    className="w-full p-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                  />
                  {jsonContent && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute top-3 right-3 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800/80 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                  >
                    <ClipboardPaste className="w-4 h-4 text-amber-400" />
                    <span>Paste Clipboard</span>
                  </button>

                  <button
                    type="button"
                    disabled={!jsonContent.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    <span>Parse & Sync</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Global Action Banner Preview */}
        <section className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Builder Potion Boost
              </p>
              <p className="text-xs text-slate-400">
                Instantly accelerate all active builder queues by 9 hours (10x speed).
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use Builder Potion (-9h)</span>
          </button>
        </section>

        {/* Builders Queue Tracker (6 Slots) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Hammer className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Active Builders</h2>
              <span className="text-xs text-slate-400 font-mono">
                (4 / 6 Busy)
              </span>
            </div>
            <span className="text-xs text-slate-500">Live Preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockBuilders.map((builder) => (
              <div
                key={builder.id}
                className={`relative rounded-xl border p-4 transition ${
                  builder.isIdle
                    ? "border-slate-800/60 bg-slate-900/20 text-slate-500"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        builder.isIdle
                          ? "bg-slate-800/50 text-slate-500 border border-slate-700/50"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      B{builder.id}
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-semibold ${
                          builder.isIdle ? "text-slate-400" : "text-white"
                        }`}
                      >
                        {builder.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {builder.status}
                      </p>
                    </div>
                  </div>

                  {!builder.isIdle && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Clock className="w-3 h-3" />
                      {builder.remaining}
                    </span>
                  )}
                </div>

                {!builder.isIdle ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${builder.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>In Progress</span>
                      <span>{builder.progress}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 text-center text-xs text-slate-600 font-medium">
                    Builder is ready for new orders
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Laboratory & Pet House Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Laboratory */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Laboratory</h2>
              </div>
              <span className="text-[11px] font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
                1d 08h 12m
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">
                  Electro Titan Level 4
                </span>
                <span className="text-xs text-fuchsia-400 font-mono">72%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-fuchsia-500 to-pink-400 h-1.5 rounded-full"
                  style={{ width: "72%" }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Elixir Research</span>
                <span>Finish: Tomorrow at 21:44</span>
              </div>
            </div>
          </div>

          {/* Pet House */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <PawPrint className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Pet House</h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                2d 19h 40m
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">
                  Diggy Level 10
                </span>
                <span className="text-xs text-emerald-400 font-mono">38%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full"
                  style={{ width: "38%" }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Hero Pet Training</span>
                <span>Finish: in 2 days</span>
              </div>
            </div>
          </div>
        </section>

        {/* Discord Setup Banner */}
        <section className="rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 flex items-center justify-center text-[#7983f5] border border-[#5865F2]/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Never miss an idle builder
              </h3>
              <p className="text-xs text-slate-400">
                Connect your Discord account to receive push notifications the exact second a building or lab upgrade completes.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="whitespace-nowrap px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs shadow-md shadow-[#5865F2]/20 transition cursor-pointer"
          >
            Connect Discord
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>
          ClashSync is an unofficial fan project and not affiliated with or endorsed by Supercell.
        </p>
      </footer>
    </div>
  );
}
