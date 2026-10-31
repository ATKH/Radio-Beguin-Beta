"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import MonkeyGameTicker from "@/components/MonkeyGameTicker";
import { usePlaylistLang } from "@/lib/playlistMeta";

type TickerBarProps = {
  text?: string;
  messages?: string[];
};

const REPEAT_COUNT = 4;
const MONKEY_CLEAN_THRESHOLD = 235;
const THIN_SPACE = "\u2009";
const LETTER_VARIANTS = ["rise", "drop", "swing-left", "swing-right", "flat"] as const;

// Espace entre les mots : 4 = large, 3 = moyen, 2 = serré, 1 = très serré
const WORD_GAP_SPACES = 2;

// Vitesse de défilement : on garde la même vitesse que l'ancienne barre (200 s pour « Radio Béguin »),
// quel que soit le nombre de messages. Une « unité » = une lettre ; un singe + espaces = MONKEY_UNITS.
const SECONDS_PER_UNIT = 2.3;
const MONKEY_UNITS = 10;

const HEART_LABEL = {
  fr: "Proposer un message pour la barre",
  en: "Suggest a message for the bar",
} as const;

type LetterBlueprint =
  | { kind: "letter"; char: string; variant: typeof LETTER_VARIANTS[number]; index: number }
  | { kind: "gap"; index: number };

type Segment =
  | { kind: "message"; key: string; blueprint: LetterBlueprint[] }
  | { kind: "monkey"; key: string };

let cachedMonkeyUrl: string | null = null;
let processingPromise: Promise<string | null> | null = null;

const createLetterBlueprint = (value: string): LetterBlueprint[] => {
  const upper = value.toUpperCase().trim();
  if (!upper) return [];

  const words = upper.split(/\s+/);
  const blueprint: LetterBlueprint[] = [];
  let variantIndex = 0;
  let globalIndex = 0;

  words.forEach((word, wordIndex) => {
    Array.from(word).forEach((char) => {
      const variant = LETTER_VARIANTS[variantIndex % LETTER_VARIANTS.length];
      blueprint.push({ kind: "letter", char, variant, index: globalIndex++ });
      variantIndex += 1;
    });

    if (wordIndex < words.length - 1) {
      blueprint.push({ kind: "gap", index: globalIndex++ });
    }
  });

  return blueprint;
};

const processMonkeyImage = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (cachedMonkeyUrl) return Promise.resolve(cachedMonkeyUrl);
  if (processingPromise) return processingPromise;

  processingPromise = new Promise<string | null>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = "/Singe4_clean.png";

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

export default function TickerBar({ text, messages }: TickerBarProps) {
  const lang = usePlaylistLang();
  const [isGameActive, setIsGameActive] = useState(false);
  const [monkeyUrl, setMonkeyUrl] = useState<string | null>(null);
  const [communityMessages, setCommunityMessages] = useState<string[]>([]);

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

  // Messages proposés par les auditeurs et validés par l'équipe
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ticker/messages", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        setCommunityMessages(
          data.filter((m): m is string => typeof m === "string" && m.trim() !== "")
        );
      })
      .catch((error) => {
        // pas de souci : la barre garde son message habituel
        console.error("Impossible de charger les messages de la barre", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedMessages = useMemo(() => {
    if (messages?.length) {
      return messages.map(message => message.trim()).filter(Boolean);
    }
    const trimmed = text?.trim();
    return trimmed ? [trimmed] : [];
  }, [messages, text]);

  const baseMessage = normalizedMessages[0] ?? "Radio Béguin";

  // Roulement : Radio Béguin, message 1, Radio Béguin, message 2, ...
  // Avec un seul message, il alterne simplement avec Radio Béguin.
  const blueprints = useMemo(() => {
    const base = createLetterBlueprint(baseMessage);
    const community = communityMessages
      .map(createLetterBlueprint)
      .filter((blueprint) => blueprint.length > 0);

    if (base.length === 0) return community;
    if (community.length === 0) return [base];

    return community.flatMap((blueprint) => [base, blueprint]);
  }, [baseMessage, communityMessages]);

  const tickerSegments = useMemo<Segment[]>(() => {
    if (blueprints.length === 0) return [];
    const segments: Segment[] = [];

    // Le cycle complet (tous les messages) est répété REPEAT_COUNT fois pour une boucle sans coupure
    for (let repeat = 0; repeat < REPEAT_COUNT; repeat += 1) {
      blueprints.forEach((blueprint, index) => {
        const id = `${repeat}-${index}`;
        segments.push({ kind: "message", key: `msg-${id}`, blueprint });
        segments.push({ kind: "message", key: `msg-gap-${id}`, blueprint: [] });
        segments.push({ kind: "monkey", key: `monkey-${id}` });
        segments.push({ kind: "message", key: `msg-gap-after-${id}`, blueprint: [] });
      });
    }

    return segments;
  }, [blueprints]);

  // Plus il y a de messages, plus la durée augmente, pour garder la même vitesse
  const scrollDuration = useMemo(() => {
    const units =
      blueprints.reduce((sum, blueprint) => sum + blueprint.length + MONKEY_UNITS, 0) * REPEAT_COUNT;
    return Math.max(60, Math.round(units * SECONDS_PER_UNIT));
  }, [blueprints]);

  return (
    <div className="ticker-gradient text-[var(--ticker-foreground)] border-y-2 border-[var(--ticker-border,#0a0a0a)] relative overflow-hidden">
      <div className="container mx-auto px-4 py-2 min-h-[48px] flex w-full items-center">
        {isGameActive ? (
          <MonkeyGameTicker
            onExit={() => {
              setIsGameActive(false);
            }}
          />
        ) : (
          <>
            <div className="ticker-track flex-1">
              <span
                className="ticker-text font-semibold tracking-[0.25em] uppercase text-sm"
                style={{ animationDuration: `${scrollDuration}s` }}
              >
                {tickerSegments.map(segment => {
                  if (segment.kind === "monkey") {
                    return (
                      <span key={segment.key} className="ticker-segment">
                        <button
                          type="button"
                          onClick={() => setIsGameActive(true)}
                          className="ticker-monkey-button"
                          aria-label="Lancer le jeu du Singe Béguin"
                        >
                          <span className="ticker-monkey">
                            <Image
                              src={monkeyUrl ?? "/Singe4_clean.png"}
                              alt=""
                              width={36}
                              height={36}
                              className="ticker-monkey__image animate-monkey-step"
                              draggable={false}
                              unoptimized
                            />
                          </span>
                        </button>
                        {/* pas de séparateur après le singe */}
                      </span>
                    );
                  }

                  return (
                    <span key={segment.key} className="ticker-segment ticker-segment--message">
                      {segment.blueprint.length === 0 ? (
                        <span className="ticker-gap-large" aria-hidden="true">
                          {THIN_SPACE.repeat(16)}
                        </span>
                      ) : (
                        segment.blueprint.map(unit => {
                          if (unit.kind === "letter") {
                            return (
                              <span
                                key={`${segment.key}-letter-${unit.index}`}
                                className={`ticker-letter ticker-letter--${unit.variant}`}
                              >
                                {unit.char}
                              </span>
                            );
                          }

                          return (
                            <span
                              key={`${segment.key}-gap-${unit.index}`}
                              className="ticker-spacing"
                              aria-hidden="true"
                            >
                              {THIN_SPACE.repeat(WORD_GAP_SPACES)}
                            </span>
                          );
                        })
                      )}
                    </span>
                  );
                })}
              </span>
            </div>

            {/* Cœur : renvoie vers la page où l'on propose un message pour la barre */}
            <Link
              href="/ticker"
              aria-label={HEART_LABEL[lang]}
              title={HEART_LABEL[lang]}
              className="ml-3 flex-shrink-0 rounded-full p-1.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <Heart className="h-5 w-5" fill="currentColor" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}