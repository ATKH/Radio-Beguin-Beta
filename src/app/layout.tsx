// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Player from "@/components/Player";
import Footer from "@/components/Footer";
import { PlayerProvider } from "@/lib/PlayerContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import TickerBar from "@/components/TickerBar";

export const metadata: Metadata = {
  title: "Radio Béguin",
  description: "",
};

const HEADER_HEIGHT = 56;
const PLAYER_HEIGHT = 58;
const NEWS_TICKER_TEXT = "MANGEZ BOUGEZ • EVENEMENT AU GRRRND ZERO LE DIMANCHE 26 OCTOBRE";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="theme-light" suppressHydrationWarning>
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <PlayerProvider>
            <div className="relative min-h-screen">
              <div className="flex flex-col min-h-screen relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-50">
                  <Header />
                </header>

                {/* Bandeau d'information */}
                <TickerBar text={NEWS_TICKER_TEXT} />

                {/* Player */}
                <div
                  className="sticky z-40"
                  style={{ top: `${HEADER_HEIGHT}px`, height: `${PLAYER_HEIGHT}px` }}
                >
                  <Player />
                </div>

                {/* Contenu principal */}
                <main className="flex-1 pt-16 sm:pt-0">{children}</main>

                {/* Footer */}
                <Footer />

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
        </ThemeProvider>
      </body>
    </html>
  );
}
