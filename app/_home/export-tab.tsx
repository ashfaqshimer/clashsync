import { ArrowRight, ClipboardPaste, Loader2, RotateCcw, Sparkles } from "lucide-react";

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
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          In-game: Settings → More Settings → Export Village data → Copy
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </button>

          <button
            type="button"
            onClick={onPasteClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          {jsonInput && (
            <button
              type="button"
              onClick={onClear}
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
        onChange={(e) => onJsonInputChange(e.target.value)}
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
          onClick={onSync}
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
  );
}
