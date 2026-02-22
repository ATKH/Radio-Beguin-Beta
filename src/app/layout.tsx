// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Player from "@/components/Player";
import Footer from "@/components/Footer";
import { PlayerProvider } from "@/lib/PlayerContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import TickerBar from "@/components/TickerBar";
import CookieBanner from "@/components/CookieBanner";
import { LocaleProvider } from "@/lib/LocaleContext";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://radiobeguin.com"),
  title: "Radio Béguin",
  description: "A 24/7 online music radio based in Lyon, showcasing the best of emerging artists and more!",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "Radio Béguin",
    description: "A 24/7 online music radio based in Lyon, showcasing the best of emerging artists and more!",
    url: "https://radiobeguin.com",
    siteName: "Radio Béguin",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/logo-dark.svg",
        width: 800,
        height: 800,
        alt: "Logo Radio Béguin",
      },
    ],
  },
};

const NEWS_TICKER_MESSAGES = [
   "LYON ATTENTION : FASCISTES DANS NOS RUES, RESTEZ VIGILANT-E-S <3"
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <LocaleProvider>
            <PlayerProvider>
              <div className="relative min-h-screen">
                <div className="flex flex-col min-h-screen relative z-10">
                  {/* Header */}
                  <Header />

                  {/* Bandeau d'information */}
                  <TickerBar messages={NEWS_TICKER_MESSAGES} />

                  {/* Player */}
                  <Player />

                  {/* Contenu principal */}
                  <main className="flex-1 pt-12 sm:pt-0">{children}</main>

                  {/* Footer */}
                  <Footer />

                  {/* Consentement cookies */}
                  <CookieBanner />

                  {/* Filtres SVG */}
                  <svg className="hidden">
                    <filter id="halftone">
                      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="turb" />
                      <feColorMatrix type="saturate" values="0" />
                      <feComponentTransfer>
                        <feFuncR type="discrete" tableValues="0 1" />
                        <feFuncG type="discrete" tableValues="0 1" />
                        <feFuncB type="discrete" tableValues="0 1" />
                      </feComponentTransfer>
                      <feComposite
                        in="SourceGraphic"
                        in2="turb"
                        operator="arithmetic"
                        k1="1"
                        k2="0.8"
                        k3="0"
                        k4="0"
                      />
                    </filter>
                  </svg>
                </div>
              </div>
            </PlayerProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
