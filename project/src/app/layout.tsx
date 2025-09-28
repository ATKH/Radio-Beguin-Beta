// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Player from "@/components/Player";
import Footer from "@/components/Footer";
import { PlayerProvider } from "@/lib/PlayerContext";

export const metadata: Metadata = {
  title: "Radio Béguin",
  description: "Radio indépendante dédiée à la découverte musicale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased bg-white text-pink-500">
        <PlayerProvider>
          <div className="flex flex-col min-h-screen">
            {/* Header sticky */}
            <header className="sticky top-0 z-50 bg-white">
              <Header />
            </header>

            {/* Ligne rose sticky */}
            <div className="sticky top-[70px] z-50 w-full h-[2px] bg-pink-500" />

            {/* Player sticky */}
            <div className="sticky top-[72px] z-40 bg-white h-[70px]">
              <Player />
            </div>

            {/* Contenu principal */}
            <main className="flex-1">{children}</main>

            {/* Footer global */}
            <Footer />

            {/* Définitions de filtres SVG invisibles */}
            <svg className="hidden">
              <filter id="halftone">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="3"
                  result="turb"
                />
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
        </PlayerProvider>
      </body>
    </html>
  );
}
