"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2, MessageCircle } from "lucide-react";
import { ALERT_LEAD_OPTIONS, alertLeadLabel, SWEEP_INTERVAL_SECONDS } from "@/lib/alerts";

type Action = "save" | "test" | "remove" | "dm-on" | "dm-off" | "lead";

const METHOD: Record<Action, string> = {
  save: "PUT",
  test: "POST",
  remove: "DELETE",
  "dm-on": "PATCH",
  "dm-off": "PATCH",
  lead: "PATCH",
};

const SUCCESS: Record<Action, string> = {
  save: "Channel alerts are on. Check your Discord channel for a confirmation.",
  test: "Test alert sent.",
  remove: "Channel alerts turned off.",
  "dm-on": "DM alerts are on. Check your Discord DMs for a confirmation.",
  "dm-off": "DM alerts turned off.",
  lead: "Alert time saved.",
};

export function AlertsCard({
  tag,
  webhookOn,
  dmOn,
  leadMinutes,
  dmAvailable,
}: {
  tag: string;
  webhookOn: boolean;
  dmOn: boolean;
  leadMinutes: number;
  dmAvailable: boolean;
}) {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Action | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const anyOn = webhookOn || dmOn;

  const call = async (action: Action, lead?: number) => {
    setPending(action);
    setMessage(null);
    try {
      const res = await fetch("/api/village/notifications", {
        method: METHOD[action],
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag,
          webhookUrl: action === "save" ? webhookUrl : undefined,
          dm: action === "dm-on" ? true : action === "dm-off" ? false : undefined,
          leadMinutes: action === "lead" ? lead : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error ?? "Something went wrong.", tone: "error" });
        return;
      }
      if (action === "save") {
        setWebhookUrl("");
        setEditing(false);
      }
      setMessage({ text: SUCCESS[action], tone: "ok" });
      router.refresh();
    } catch {
      setMessage({ text: "Couldn't reach ClashSync. Try again.", tone: "error" });
    } finally {
      setPending(null);
    }
  };

  const spinner = (a: Action) => pending === a && <Loader2 className="w-3.5 h-3.5 animate-spin" />;
  const secondary =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 disabled:opacity-50 transition cursor-pointer";
  const busy = pending !== null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <BellRing className={`w-5 h-5 shrink-0 mt-0.5 ${anyOn ? "text-emerald-400" : "text-indigo-400"}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Discord alerts {anyOn && <span className="text-emerald-400 font-normal">· on</span>}
            </h2>
            {anyOn && (
              <button type="button" onClick={() => call("test")} disabled={busy} className={secondary}>
                {spinner("test")}
                Send test
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
            <label htmlFor="alert-lead">Alert me</label>
            <select
              id="alert-lead"
              value={leadMinutes}
              disabled={busy}
              onChange={(e) => call("lead", Number(e.target.value))}
              className="px-2 py-1 rounded-md bg-slate-950/90 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
            >
              {ALERT_LEAD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {alertLeadLabel(m).toLowerCase()}
                </option>
              ))}
            </select>
            {spinner("lead")}
            <span className="text-slate-500">
              {leadMinutes > 0
                ? `arrives ${leadMinutes}–${leadMinutes + SWEEP_INTERVAL_SECONDS / 60} min before an upgrade finishes, so you can be in the game for it`
                : `arrives within ${SWEEP_INTERVAL_SECONDS / 60} min after an upgrade finishes`}
            </span>
          </div>
        </div>
      </div>

      {/* Direct messages from the ClashSync bot */}
      {dmAvailable && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MessageCircle className={`w-4 h-4 ${dmOn ? "text-emerald-400" : "text-slate-500"}`} />
            {dmOn ? "Sending you a DM" : "Get alerts as a Discord DM"}
          </div>
          <button
            type="button"
            onClick={() => call(dmOn ? "dm-off" : "dm-on")}
            disabled={busy}
            className={
              dmOn
                ? secondary
                : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
            }
          >
            {spinner("dm-on")}
            {spinner("dm-off")}
            {dmOn ? "Turn off" : "Turn on"}
          </button>
        </div>
      )}

      {/* Channel webhook */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <BellRing className={`w-4 h-4 ${webhookOn ? "text-emerald-400" : "text-slate-500"}`} />
            {webhookOn ? "Posting to a Discord channel" : "Post to a Discord channel (webhook)"}
          </div>
          {!editing && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(true)} disabled={busy} className={secondary}>
                {webhookOn ? "Change webhook" : "Set up"}
              </button>
              {webhookOn && (
                <button type="button" onClick={() => call("remove")} disabled={busy} className={secondary}>
                  {spinner("remove")}
                  Turn off
                </button>
              )}
            </div>
          )}
        </div>

        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              call("save");
            }}
            className="space-y-2"
          >
            <p className="text-[11px] text-slate-500">
              In Discord: Channel settings → Integrations → Webhooks → New Webhook → Copy Webhook URL.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 px-3 py-2 bg-slate-950/90 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                disabled={busy || !webhookUrl.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition cursor-pointer"
              >
                {spinner("save")}
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className={secondary}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {message && (
        <p className={`text-xs ${message.tone === "ok" ? "text-emerald-400" : "text-rose-400"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
