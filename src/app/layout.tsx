import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orbit — Modern Issue & Project Workspace",
  description:
    "A keyboard-first, Linear-inspired project & issue tracker built with Next.js App Router, TypeScript, dnd-kit, Recharts, and cross-tab real-time sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-indigo-500/25 selection:text-indigo-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
