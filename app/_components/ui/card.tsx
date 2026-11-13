import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "./cx";

export type CardTone = "stone" | "wood";

/** Panel: `stone` for everyday content, `wood` for the main section of a page. */
export function Card<T extends ElementType = "section">({
  as,
  tone = "stone",
  className,
  ...props
}: { as?: T; tone?: CardTone; className?: string } & Omit<ComponentPropsWithoutRef<T>, "as" | "className">) {
  const Tag: ElementType = as ?? "section";
  return <Tag className={cx(tone === "wood" ? "panel-wood" : "panel-stone", className)} {...props} />;
}

/** Recessed area inside a card (inputs, lists, sub-sections). */
export function Well<T extends ElementType = "div">({
  as,
  className,
  ...props
}: { as?: T; className?: string } & Omit<ComponentPropsWithoutRef<T>, "as" | "className">) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("well", className)} {...props} />;
}

const HEADING_SIZE = {
  sm: "text-base",
  md: "text-lg sm:text-xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-3xl sm:text-4xl",
} as const;

/** Chunky outlined game heading. */
export function Heading({
  as: Tag = "h2",
  size = "md",
  gold,
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  size?: keyof typeof HEADING_SIZE;
  gold?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cx("heading-outline", gold && "is-gold", HEADING_SIZE[size], className)}>{children}</Tag>
  );
}

/** Card title row: icon chip, outlined title, optional count and right-hand actions. */
export function CardHeader({
  icon,
  title,
  count,
  actions,
  as = "h2",
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  count?: ReactNode;
  actions?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-center justify-between gap-x-3 gap-y-2", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <Heading as={as} size="sm" className="min-w-0 truncate">
          {title}
          {count !== undefined && <span className="ml-1.5 text-gold-300">({count})</span>}
        </Heading>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
