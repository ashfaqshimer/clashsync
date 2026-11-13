import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Dev-only review pages (style guide + fixture states used by `pnpm screenshots`).
 * They render real components with fake data and never touch the database.
 * In production every /dev route is a 404.
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
