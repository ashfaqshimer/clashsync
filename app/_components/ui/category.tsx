import { Clock, FlaskConical, Hammer, PawPrint, Wrench, type LucideIcon } from "lucide-react";
import { Badge, type Tone } from "./badge";

/** Look of each upgrade category, shared by the home page and the dashboard. */
export const CATEGORY_STYLE: Record<string, { label: string; Icon: LucideIcon; tone: Tone; text: string }> = {
  BUILDER: { label: "Builder", Icon: Hammer, tone: "gold", text: "text-gold-300" },
  LABORATORY: { label: "Laboratory", Icon: FlaskConical, tone: "elixir", text: "text-elixir" },
  PET_HOUSE: { label: "Pet House", Icon: PawPrint, tone: "green", text: "text-grass" },
  BUILDER_BASE: { label: "Builder Base", Icon: Wrench, tone: "sky", text: "text-sky" },
  OTHER: { label: "Upgrade", Icon: Clock, tone: "stone", text: "text-muted" },
};

export function CategoryBadge({ category }: { category: string }) {
  const { label, Icon, tone } = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.OTHER;
  return (
    <Badge tone={tone} icon={<Icon className="h-3 w-3" />}>
      {label}
    </Badge>
  );
}
