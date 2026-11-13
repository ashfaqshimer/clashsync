import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "./cx";

export type Tone = "gold" | "elixir" | "green" | "sky" | "red" | "stone" | "discord";

/** Small outlined pill label. */
export function Badge({
  tone = "stone",
  icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cx("badge", `badge-${tone}`, className)}>
      {icon}
      {children}
    </span>
  );
}

const CHIP_SIZE = {
  sm: "h-7 w-7 [&>svg]:h-3.5 [&>svg]:w-3.5",
  md: "h-9 w-9 [&>svg]:h-4.5 [&>svg]:w-4.5",
  lg: "h-12 w-12 rounded-xl [&>svg]:h-6 [&>svg]:w-6",
} as const;

/** Bevelled rounded-square holder for an icon, like the in-game side buttons. */
export function IconChip({
  tone = "gold",
  size = "md",
  className,
  children,
}: {
  tone?: Tone;
  size?: keyof typeof CHIP_SIZE;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span aria-hidden className={cx("icon-chip", `icon-chip-${tone}`, CHIP_SIZE[size], className)}>
      {children}
    </span>
  );
}

/** Red notification dot with a white ring. */
export function Pip({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={cx("pip", className)} {...props} />;
}
