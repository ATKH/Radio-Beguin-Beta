"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import PlayButton from "@/components/PlayButton";
import { Button } from "@/components/ui/button";
import type { PodcastEpisode } from "@/lib/podcasts";

// Mélange aléatoire (Fisher–Yates)
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const ARTWORK_SIZES =
  "(min-width: 1280px) 26vw, (min-width: 1024px) 34vw, (min-width: 768px) 48vw, 94vw";
const HIGH_PRIORITY_COUNT = 2;
const ARTWORK_QUALITY = 90;

const normalizeTag = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const MOOD_NAMES = [
  "Talk",
  "Meditation Core",
  "Métro Boulot",
  "Curiosités",
  "Bain de Soleil",
  "Crépuscule",
  "Appels de Phares",
  "Abysses",
  "Appel de Phares",
  "Appel de phares",
  "Appels de Phare",
  "Appels de phare",
  "Appels de phares",
  "Bain de soleil",
];

const TALK_KEY = normalizeTag("Talk");
const MOOD_KEYS = new Set(MOOD_NAMES.map(normalizeTag));

const shouldHideTag = (tag: string) => {
  if (!tag) return false;
  const key = normalizeTag(tag);
  if (!key) return false;
  if (key === TALK_KEY) return false;
  return MOOD_KEYS.has(key);
};

export default function SelectionSection({ initialEpisodes }: { initialEpisodes: PodcastEpisode[] }) {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [isWizzing, setIsWizzing] = useState(false);

  // première sélection
  useEffect(() => {
    if (initialEpisodes?.length) {
      setEpisodes(initialEpisodes.slice(0, 8));
    }
  }, [initialEpisodes]);

  // nouvelle sélection au clic
  const refreshSelection = () => {
    if (initialEpisodes?.length) {
      const shuffled = shuffle(initialEpisodes);
      setEpisodes(shuffled.slice(0, 8));
      setIsWizzing(true);
      setTimeout(() => setIsWizzing(false), 600);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header Sélection + Singe */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          Sélection
          <button
            onClick={refreshSelection}
            className={`singe-beguin flex-shrink-0 ${isWizzing ? "active animate-bounce-once" : ""}`}
            title="Nouvelle sélection"
          >
            <Image
              src="/Singe3.png"
              alt="Singe Béguin"
              width={42}
              height={42}
              className={`object-contain transition-all duration-300 ${
                isWizzing ? "filter-none scale-110" : "grayscale contrast-125 brightness-90"
              }`}
            />
          </button>
        </h2>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="tag-pill tag-pill-sm group flex items-center gap-2 px-4 py-2 uppercase text-[10px] tracking-[0.22em] font-semibold transition-all duration-200 hover:bg-[var(--primary)] hover:text-white"
        >
          <Link href="/shows" className="flex items-center gap-2">
            <span className="relative">Tout découvrir</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      {/* Grille des podcasts */}
      {episodes.length === 0 ? (
        <p className="text-center text-muted-foreground">Aucun podcast disponible.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {episodes.map((episode, index) => {
            const styleTags = (episode.tags ?? [])
              .filter(tag => tag && tag.length > 0 && !shouldHideTag(tag));

            return (
              <div
                key={episode.id}
                className="group bg-muted rounded-lg overflow-hidden transition-all duration-200"
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src={episode.artworkUrl}
                    alt={episode.title}
                    fill
                    sizes={ARTWORK_SIZES}
                    quality={ARTWORK_QUALITY}
                    priority={index < HIGH_PRIORITY_COUNT}
                    loading={index < HIGH_PRIORITY_COUNT ? "eager" : "lazy"}
                    fetchPriority={index < HIGH_PRIORITY_COUNT ? "high" : "auto"}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <PlayButton episode={episode} />
                  </div>
                </div>
                <div className="px-3 py-2 space-y-1.5 sm:py-3 sm:space-y-2">
                  <Link
                    href={`/shows/${encodeURIComponent(episode.id)}`}
                    className="block font-semibold text-sm hover:underline line-clamp-2 text-[var(--foreground)]"
                    title={episode.title}
                  >
                    {episode.title}
                  </Link>

                  {styleTags.length ? (
                    <div className="flex flex-wrap gap-1">
                      {styleTags.map((tag, tagIndex) => (
                        <Link
                          key={`${tag}-${tagIndex}`}
                          href={`/shows?tag=${encodeURIComponent(tag)}`}
                          className="tag-pill tag-pill-xs"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
