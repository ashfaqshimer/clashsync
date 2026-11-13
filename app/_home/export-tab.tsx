import { ArrowRight, ClipboardPaste, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface ExportTabProps {
  jsonInput: string;
  onJsonInputChange: (value: string) => void;
  copyFeedback: string | null;
  isSaving: boolean;
  onLoadSample: () => void;
  onPasteClipboard: () => void;
  onClear: () => void;
  onSync: () => void;
}

export function ExportTab({
  jsonInput,
  onJsonInputChange,
  copyFeedback,
  isSaving,
  onLoadSample,
  onPasteClipboard,
  onClear,
  onSync,
}: ExportTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-semibold text-cream/90">
          In-game: Settings → More Settings → Export Village data → Copy
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onLoadSample}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </Button>

          <Button size="sm" variant="stone" onClick={onPasteClipboard}>
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste</span>
          </Button>

          {jsonInput && (
            <Button size="sm" variant="stone" onClick={onClear}>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      <textarea
        rows={7}
        value={jsonInput}
        onChange={(e) => onJsonInputChange(e.target.value)}
        placeholder='Paste your village export here (it starts with {"tag": "#…)'
        aria-label="Village export data"
        className="field p-4 font-mono text-xs leading-relaxed"
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="text-xs font-semibold" aria-live="polite">
          {copyFeedback ? (
            <span className="text-gold-200">{copyFeedback}</span>
          ) : (
            <span className="text-cream/90">Automatically tracks and calculates exact finish times.</span>
          )}
        </div>

        <Button size="lg" onClick={onSync} disabled={!jsonInput.trim() || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Syncing Village...</span>
            </>
          ) : (
            <>
              <span>Sync Village</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
