import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export function SyncNotice({
  message,
  dashboardPath,
}: {
  message: string;
  dashboardPath: string | null;
}) {
  return (
    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <div className="flex-1 font-medium">{message}</div>
      {dashboardPath ? (
        <Link
          href={dashboardPath}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1 rounded transition"
        >
          Open live dashboard
          <ArrowRight className="w-3 h-3" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
          Synced
        </span>
      )}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-rose-300 text-xs">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
      <div>
        <p className="font-semibold text-rose-200">Notice</p>
        <p className="mt-0.5">{message}</p>
      </div>
    </div>
  );
}
