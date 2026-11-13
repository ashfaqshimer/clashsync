import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge, IconChip } from "@/app/_components/ui/badge";
import { buttonClass } from "@/app/_components/ui/button";

export function SyncNotice({
  message,
  dashboardPath,
}: {
  message: string;
  dashboardPath: string | null;
}) {
  return (
    <div
      role="status"
      className="panel-stone !border-grass/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in"
    >
      <div className="flex flex-1 items-center gap-3">
        <IconChip tone="green" size="sm">
          <CheckCircle2 />
        </IconChip>
        <div className="flex-1 text-sm font-bold text-cream">{message}</div>
      </div>
      {dashboardPath ? (
        <Link href={dashboardPath} className={buttonClass({ variant: "green", size: "md", className: "self-end sm:self-auto" })}>
          Open live dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <Badge tone="green" className="self-end sm:self-auto">
          Synced
        </Badge>
      )}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div role="alert" className="panel-stone !border-ruby/70 p-4 flex items-start gap-3 animate-fade-in">
      <IconChip tone="red" size="sm">
        <AlertCircle />
      </IconChip>
      <div>
        <p className="font-display text-base text-[#ffb3ab]">Notice</p>
        <p className="mt-0.5 text-sm font-semibold text-cream/90">{message}</p>
      </div>
    </div>
  );
}
