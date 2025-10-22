"use client";

import React, { useEffect, useMemo, useState } from "react";
import MonkeyGameTicker from "@/components/MonkeyGameTicker";

type TickerBarProps = {
  text: string;
};

const REPEAT_COUNT = 4;
const MONKEY_CLEAN_THRESHOLD = 235;

let cachedMonkeyUrl: string | null = null;
let processingPromise: Promise<string | null> | null = null;

const processMonkeyImage = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (cachedMonkeyUrl) return Promise.resolve(cachedMonkeyUrl);
  if (processingPromise) return processingPromise;

  processingPromise = new Promise<string | null>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = "/Singe4.png";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          processingPromise = null;
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let updated = false;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > MONKEY_CLEAN_THRESHOLD && g > MONKEY_CLEAN_THRESHOLD && b > MONKEY_CLEAN_THRESHOLD) {
            data[i + 3] = 0;
            updated = true;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          }
        }

        if (updated) {
          ctx.putImageData(imageData, 0, 0);
        }

        const url = canvas.toDataURL("image/png");
        cachedMonkeyUrl = url;
        resolve(url);
      } catch (error) {
        console.error("Impossible de nettoyer l'image du singe", error);
        resolve(null);
      } finally {
        processingPromise = null;
      }
    };

    img.onerror = () => {
      resolve(null);
      processingPromise = null;
    };
  });

  return processingPromise;
};

export default function TickerBar({ text }: TickerBarProps) {
  const [isGameActive, setIsGameActive] = useState(false);
  const [monkeyUrl, setMonkeyUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    processMonkeyImage().then((url) => {
      if (cancelled) return;
      if (url) {
        setMonkeyUrl(url);
      } else {
        setMonkeyUrl(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const tickerSegments = useMemo(() => {
    const trimmed = text?.trim();
    if (!trimmed) {
      return [];
    }
    return Array.from({ length: REPEAT_COUNT }, () => trimmed);
  }, [text]);

  return (
    <div className="ticker-gradient text-[var(--ticker-foreground)] border-y-2 border-black relative overflow-hidden">
      <div className="container mx-auto px-4 py-2 min-h-[48px] flex w-full items-center">
        {isGameActive ? (
          <MonkeyGameTicker
            onExit={() => {
              setIsGameActive(false);
            }}
          />
        ) : (
          <div className="ticker-track flex-1">
            <span className="ticker-text font-semibold tracking-[0.25em] uppercase text-sm">
              {tickerSegments.map((segment, index) => (
                <span key={`segment-${index}`} className="ticker-segment">
                  <span>{segment}</span>
                  {index < tickerSegments.length - 1 && (
                    <span className="ticker-separator" aria-hidden="true">
                      •
                    </span>
                  )}
                </span>
              ))}
              <span className="ticker-separator" aria-hidden="true">
                •
              </span>
              <button
                type="button"
                onClick={() => setIsGameActive(true)}
                className="ticker-monkey-button"
                aria-label="Lancer le jeu du Singe Béguin"
              >
                <span className="ticker-monkey">
                  <img
                    src={monkeyUrl ?? "/Singe4.png"}
                    alt=""
                    className="ticker-monkey__image animate-monkey-step"
                    draggable={false}
                  />
                </span>
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
