import { AlertCircle } from "lucide-react";
import { IconChip } from "@/app/_components/ui/badge";

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div role="alert" className="panel-stone !border-ruby/70 p-4 flex items-start gap-3 animate-fade-in">
      <IconChip tone="red" size="sm">
        <AlertCircle />
      </IconChip>
      <div>
        <p className="font-display text-base text-[#ffb3ab]">Something&apos;s not right</p>
        <p className="mt-0.5 text-sm font-semibold text-cream/90">{message}</p>
      </div>
    </div>
  );
}
