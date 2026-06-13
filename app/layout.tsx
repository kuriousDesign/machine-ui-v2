import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { FullPage } from "@/components/layout/full-page";

import { Providers } from "./providers";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Machine UI V2",
  description: "MQTT bridge explorer for device topology, subscriptions, and TagTopics cache status.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${monoFont.variable}`}>
        <Providers>
          <Suspense fallback={null}>
            <FullPage>{children}</FullPage>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
