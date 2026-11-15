"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { normalizeTag, tagToSlug } from "@/lib/tags";
import { Button } from "@/app/_components/ui/button";

/** "Already synced?" shortcut: jumps straight to a village's dashboard by player tag. */
export function FindByTag() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="panel-stone p-4 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const tag = normalizeTag(value);
        if (!tag) {
          setError("That isn't a valid player tag. You'll find yours under your name on your in-game profile.");
          return;
        }
        router.push(`/v/${tagToSlug(tag)}`);
      }}
    >
      <label htmlFor="find-tag" className="flex items-center gap-2 text-sm font-bold text-cream">
        <Search className="w-4 h-4 text-sky" aria-hidden />
        Already synced? Open your dashboard by player tag
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-display text-gold-300" aria-hidden>
            #
          </span>
          <input
            id="find-tag"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="Your player tag"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "find-tag-error" : undefined}
            className="field h-10 pl-8 pr-3 text-sm font-mono"
          />
        </div>
        <Button type="submit" variant="blue" disabled={!value.trim()}>
          <span className="max-sm:sr-only">Open</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {error && (
        <p id="find-tag-error" className="text-xs font-semibold text-[#ff8a80]">
          {error}
        </p>
      )}
    </form>
  );
}
