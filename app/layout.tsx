import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClashSync | Clash of Clans Village Queue & Timer Sync",
  description:
    "Live-sync active builder, laboratory, and pet house queues for Clash of Clans. Track countdowns, pop builder potions, and receive Discord notifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
