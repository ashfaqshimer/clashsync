"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2, MessageCircle } from "lucide-react";
import { ALERT_LEAD_OPTIONS, alertLeadLabel, SWEEP_INTERVAL_SECONDS } from "@/lib/alerts";
import { IconChip } from "@/app/_components/ui/badge";
import { Button, buttonClass } from "@/app/_components/ui/button";
import { Card, Heading, Well } from "@/app/_components/ui/card";

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
  const secondary = buttonClass({ variant: "stone", size: "sm" });
  const busy = pending !== null;

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <IconChip tone={anyOn ? "green" : "discord"}>
          <BellRing />
        </IconChip>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Heading size="sm" className="flex items-center gap-2">
              Discord alerts {anyOn && <span className="text-grass">· on</span>}
            </Heading>
            {anyOn && (
              <button type="button" onClick={() => call("test")} disabled={busy} className={secondary}>
                {spinner("test")}
                Send test
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm font-semibold text-muted">
            <label htmlFor="alert-lead">Alert me</label>
            <select
              id="alert-lead"
              value={leadMinutes}
              disabled={busy}
              onChange={(e) => call("lead", Number(e.target.value))}
              className="field !w-auto h-9 pl-2.5 pr-1 text-sm font-bold"
            >
              {ALERT_LEAD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {alertLeadLabel(m).toLowerCase()}
                </option>
              ))}
            </select>
            {spinner("lead")}
            <span className="text-xs text-faint basis-full sm:basis-auto">
              {leadMinutes > 0
                ? `arrives ${leadMinutes}–${leadMinutes + SWEEP_INTERVAL_SECONDS / 60} min before an upgrade finishes, so you can be in the game for it`
                : `arrives within ${SWEEP_INTERVAL_SECONDS / 60} min after an upgrade finishes`}
            </span>
          </div>
        </div>
      </div>

      {/* Direct messages from the ClashSync bot */}
      {dmAvailable && (
        <Well className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-cream/90">
            <MessageCircle className={`w-4 h-4 ${dmOn ? "text-grass" : "text-faint"}`} />
            {dmOn ? "Sending you a DM" : "Get alerts as a Discord DM"}
          </div>
          <button
            type="button"
            onClick={() => call(dmOn ? "dm-off" : "dm-on")}
            disabled={busy}
            className={dmOn ? secondary : buttonClass({ variant: "discord", size: "sm" })}
          >
            {spinner("dm-on")}
            {spinner("dm-off")}
            {dmOn ? "Turn off" : "Turn on"}
          </button>
        </Well>
      )}

      {/* Channel webhook */}
      <Well className="p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-cream/90">
            <BellRing className={`w-4 h-4 ${webhookOn ? "text-grass" : "text-faint"}`} />
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
            <p className="text-xs font-semibold text-faint">
              In Discord: Channel settings → Integrations → Webhooks → New Webhook → Copy Webhook URL.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
                autoComplete="off"
                spellCheck={false}
                aria-label="Discord webhook URL"
                className="field h-10 px-3 font-mono text-xs sm:flex-1"
              />
              <Button type="submit" variant="green" disabled={busy || !webhookUrl.trim()}>
                {spinner("save")}
                Save
              </Button>
              <Button variant="stone" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Well>

      {message && (
        <p role="status" className={`text-sm font-bold ${message.tone === "ok" ? "text-grass" : "text-[#ff8a80]"}`}>
          {message.text}
        </p>
      )}
    </Card>
  );
}
