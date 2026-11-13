import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "gold" | "green" | "blue" | "red" | "discord" | "stone" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyle {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square button holding only an icon (give it an aria-label or title). */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Classes for a bevelled game button. Use on `<Link>`/`<a>` so links and
 * buttons look the same: `<Link className={buttonClass({ variant: "green" })}>`.
 */
export function buttonClass({ variant = "gold", size = "md", iconOnly, className }: ButtonStyle = {}) {
  return cx("btn", `btn-${variant}`, `btn-${size}`, iconOnly && "btn-icon", className);
}

export function Button({
  variant,
  size,
  iconOnly,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle) {
  return <button type={type} className={buttonClass({ variant, size, iconOnly, className })} {...props} />;
}
