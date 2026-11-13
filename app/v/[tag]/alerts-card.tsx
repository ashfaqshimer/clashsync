"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2 } from "lucide-react";

type Action = "save" | "test" | "remove";

export function AlertsCard({ tag, enabled }: { tag: string; enabled: boolean }) {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [editing, setEditing] = useState(!enabled);
  const [pending, setPending] = useState<Action | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const call = async (action: Action) => {
    setPending(action);
    setMessage(null);
    const method = action === "save" ? "PUT" : action === "test" ? "POST" : "DELETE";
    try {
      const res = await fetch("/api/village/notifications", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, webhookUrl: action === "save" ? webhookUrl : undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error ?? "Something went wrong.", tone: "error" });
        return;
      }
      if (action === "save") {
        setWebhookUrl("");
        setEditing(false);
        setMessage({ text: "Alerts are on. Check your Discord channel for a confirmation.", tone: "ok" });
      } else if (action === "test") {
        setMessage({ text: "Test message sent to Discord.", tone: "ok" });
      } else {
        setEditing(true);
        setMessage({ text: "Alerts turned off.", tone: "ok" });
      }
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

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <BellRing className={`w-5 h-5 shrink-0 mt-0.5 ${enabled ? "text-emerald-400" : "text-indigo-400"}`} />
        <div>
          <h2 className="text-sm font-semibold text-white">
            Discord alerts {enabled && <span className="text-emerald-400 font-normal">· on</span>}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {enabled
              ? "You'll get a Discord message within a couple of minutes of an upgrade finishing."
              : "Get a Discord message when an upgrade finishes. In Discord: Channel settings → Integrations → Webhooks → New Webhook → Copy Webhook URL."}
          </p>
        </div>
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            call("save");
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
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
            disabled={pending !== null || !webhookUrl.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition cursor-pointer"
          >
            {spinner("save")}
            Save
          </button>
          {enabled && (
            <button type="button" onClick={() => setEditing(false)} className={secondary}>
              Cancel
            </button>
          )}
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => call("test")} disabled={pending !== null} className={secondary}>
            {spinner("test")}
            Send test
          </button>
          <button type="button" onClick={() => setEditing(true)} disabled={pending !== null} className={secondary}>
            Change webhook
          </button>
          <button type="button" onClick={() => call("remove")} disabled={pending !== null} className={secondary}>
            {spinner("remove")}
            Turn off
          </button>
        </div>
      )}

      {message && (
        <p className={`text-xs ${message.tone === "ok" ? "text-emerald-400" : "text-rose-400"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
