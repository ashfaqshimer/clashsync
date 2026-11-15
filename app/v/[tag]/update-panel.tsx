"use client";

import { useEffect, useRef } from "react";
import { RefreshCw, X } from "lucide-react";
import { ExportForm, ExportGuide } from "@/app/_components/export-form";
import { IconChip } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card, Heading } from "@/app/_components/ui/card";

/** Paste a fresh export without leaving the dashboard. */
export function UpdatePanel({ tag, onClose }: { tag: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  return (
    <div ref={ref} className="scroll-mt-20">
    <Card tone="wood" aria-labelledby="update-title" className="p-4 sm:p-6 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <IconChip>
            <RefreshCw />
          </IconChip>
          <div className="min-w-0">
            <Heading as="h2" size="md">
              <span id="update-title">Update your timers</span>
            </Heading>
            <p className="text-sm font-semibold text-cream/90 mt-1">
              Copy a fresh export in the game and paste it here. New upgrades show up, finished ones
              drop off.
            </p>
          </div>
        </div>
        <Button variant="stone" size="sm" iconOnly aria-label="Close" title="Close" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ExportGuide />
      <ExportForm expectedTag={tag} onSynced={onClose} submitLabel="Update timers" />
    </Card>
    </div>
  );
}
