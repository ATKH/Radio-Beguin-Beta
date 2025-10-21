"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import BackLink from "@/components/BackLink";
import type { PodcastEpisode, PodcastPlaylist } from "@/lib/podcasts";
import { usePlayer } from "@/lib/PlayerContext";

type ShowClientProps = {
  episode: PodcastEpisode;
  recommended?: PodcastEpisode[];
  parentPlaylist?: PodcastPlaylist | null;
};

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

export default function ShowClient({ episode, recommended = [], parentPlaylist = null }: ShowClientProps) {
  const { playPodcast } = usePlayer();

  // ⚡ Debug utile pour confirmer que l’épisode a bien une URL jouable
  console.log("🎧 Episode chargé dans ShowClient:", episode);

  if (episode.sharing && episode.sharing !== "public") {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Cet épisode n&apos;est pas public.
      </div>
    );
  }

  const styleTags = (episode.tags ?? [])
    .filter(tag => tag && tag.length > 0 && !shouldHideTag(tag));

  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-10 max-w-4xl mx-auto flex flex-col gap-8">
      <BackLink href="/shows" className="self-start" />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Artwork + bouton play */}
        <div className="group relative w-full max-w-xs mx-auto md:mx-0 md:w-[240px] md:flex-shrink-0 aspect-square overflow-hidden rounded-lg self-start">
          <Image
            src={
              episode.artworkUrl?.replace("-large", "-t500x500") ||
              "/default-artwork.jpg"
            }
            alt={episode.title}
            width={500}
            height={500}
            className="object-cover"
          />
          <div className="podcast-card-overlay absolute inset-0 flex items-center justify-center transition-opacity duration-200">
            <Button
              size="lg"
              onClick={() => {
                if (episode.audioUrl) {
                  void playPodcast(episode); // ✅ lance dans le player global
                } else {
                  console.warn("⚠️ Pas d&apos;URL audio disponible pour:", episode);
                }
              }}
              className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
              disabled={!episode.audioUrl} // désactivé si pas de flux
            >
              <Play className="h-6 w-6 ml-1" />
            </Button>
          </div>
        </div>

        {/* Infos épisode */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold mb-4">
            {episode.title}
          </h1>
          {styleTags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {styleTags.map((tag, tagIndex) => (
                <Link
                  key={`${tag}-${tagIndex}`}
                  href={`/shows?tag=${encodeURIComponent(tag)}`}
                  className="tag-pill tag-pill-sm"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
          {episode.description && (
            <div className="prose dark:prose-invert mb-4 whitespace-pre-line">
              {episode.description}
            </div>
          )}
          <a
            href={episode.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <span>Écouter sur SoundCloud</span>
          </a>
        </div>
      </div>
      {recommended.length > 0 && (
        <section className="border-t border-primary/20 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">Émissions à explorer</h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs font-semibold uppercase tracking-[0.25em] text-primary hover:text-primary/80"
            >
              <Link href={parentPlaylist ? `/shows/playlist/${encodeURIComponent(parentPlaylist.id)}` : '/shows'}>
                Tout voir
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommended.map(rec => {
              const recTags = (rec.tags ?? [])
                .filter(tag => tag && tag.length > 0 && !shouldHideTag(tag));

              return (
                <div
                  key={rec.id}
                  className="group mx-auto w-full max-w-[280px] bg-muted rounded-xl overflow-hidden transition-colors"
                >
                  <div className="relative w-full aspect-square overflow-hidden">
                  <Image
                    src={rec.artworkUrl}
                    alt={rec.title}
                    fill
                    sizes="(min-width: 1024px) 220px, (min-width: 640px) 40vw, 85vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => playPodcast(rec)}
                      className="h-10 w-10 rounded-full !bg-primary !text-primary-foreground hover:!bg-primary/85 shadow-lg flex items-center justify-center"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="px-3 pt-2 pb-3 space-y-1 text-sm sm:space-y-2">
                  <Link
                    href={`/shows/${encodeURIComponent(rec.id)}`}
                    className="block font-semibold hover:underline line-clamp-2 text-[var(--foreground)]"
                    title={rec.title}
                  >
                    {rec.title}
                  </Link>
                  {recTags.length ? (
                    <div className="flex flex-wrap gap-1">
                      {recTags.slice(0, 6).map((tag, tagIndex) => (
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
        </section>
      )}

    </main>
  );
}
