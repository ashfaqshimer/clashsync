"use client";

import { useEffect, useRef } from "react";
import { formatDuration } from "@/lib/parser";

/**
 * Puts the next finish in the browser tab ("4m 52s · Chief Ada"), so a
 * dashboard left open in a background tab still shows what's coming up.
 * Restores the page's own title on unmount.
 */
export function useTabCountdown(label: string, finishTimes: number[], now: number | null) {
  const original = useRef<string | null>(null);

  useEffect(() => {
    original.current = document.title;
    return () => {
      if (original.current !== null) document.title = original.current;
    };
  }, []);

  useEffect(() => {
    if (now === null) return;
    const running = finishTimes.filter((t) => t > now);
    const anyDone = finishTimes.some((t) => t <= now);
    document.title =
      running.length > 0
        ? `${anyDone ? "✅ " : ""}${formatDuration(Math.min(...running) - now)} · ${label}`
        : finishTimes.length > 0
          ? `✅ All done · ${label}`
          : original.current ?? label;
  }, [label, finishTimes, now]);
}
