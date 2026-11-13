import type { Metadata } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

// Chunky rounded display face for headings, buttons and badges
const display = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
});

// Clean rounded sans for body text (has tabular figures for countdowns)
const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

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
    <html lang="en" className={`dark h-full antialiased ${display.variable} ${body.variable}`}>
      <body className="min-h-full text-foreground flex flex-col font-sans selection:bg-gold-400/40 selection:text-cream">
        {children}
      </body>
    </html>
  );
}
