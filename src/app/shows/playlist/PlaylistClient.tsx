"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackLink from "@/components/BackLink";
import type { PodcastEpisode, PodcastPlaylist } from "@/lib/podcasts";
import { usePlayer } from "@/lib/PlayerContext";

interface PlaylistClientProps {
  playlist: PodcastPlaylist;
  episodes: PodcastEpisode[];
}

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

const PLAYLIST_ARTWORK_SIZES = "(min-width: 768px) 280px, 70vw";
const EPISODE_ARTWORK_SIZES =
  "(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 768px) 36vw, 90vw";

export default function PlaylistClient({ playlist, episodes }: PlaylistClientProps) {
  const { playPodcast } = usePlayer();
  const latestEpisode = episodes[0]; // 🔥 dernier épisode

  const handlePlay = (episode: PodcastEpisode) => {
    const audioUrl = `/api/podcast-stream/${episode.id}?ts=${Date.now()}`;
    playPodcast({ ...episode, audioUrl, streamProtocol: "progressive" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-10 max-w-6xl mx-auto flex flex-col space-y-8">
      <BackLink href="/shows" className="self-start" />

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* ✅ Image avec bouton Play */}
        <div className="group relative w-full max-w-xs mx-auto md:mx-0 md:w-[280px] aspect-square overflow-hidden rounded-lg flex-shrink-0 self-start">
          <Image
            src={playlist.artworkUrl}
            alt={playlist.title}
            fill
            sizes={PLAYLIST_ARTWORK_SIZES}
            className="object-cover"
            priority
          />
          {latestEpisode && (
            <div className="podcast-card-overlay absolute inset-0 flex items-center justify-center transition-opacity duration-200">
              <Button
                size="lg"
                onClick={() => handlePlay(latestEpisode)}
                className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
              >
                <Play className="h-6 w-6 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Infos playlist */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line max-w-2xl mb-4">
              {playlist.description}
            </p>
          )}
          {playlist.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {playlist.tags
                .filter(tag => !shouldHideTag(tag))
                .map((tag, tagIndex) => (
                  <Link
                    key={`${tag}-${tagIndex}`}
                    href={`/shows?tag=${encodeURIComponent(tag)}`}
                    className="tag-pill tag-pill-xs"
                  >
                    {tag}
                  </Link>
                ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              {playlist.trackCount} épisode
              {playlist.trackCount > 1 ? "s" : ""}
            </p>
            <a
              href={playlist.permalinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Voir sur SoundCloud ↗
            </a>
          </div>
        </div>
      </div>

      {/* ✅ Grille des épisodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {episodes.map((episode) => {
          const styleTags = (episode.tags ?? [])
            .filter(tag => tag && tag.length > 0 && !shouldHideTag(tag));

          return (
            <div
              key={episode.id}
              className="group bg-muted rounded-lg overflow-hidden transition-all duration-200 w-full max-w-[320px] mx-auto"
            >
              <div className="relative w-full aspect-square overflow-hidden">
                <Image
                  src={episode.artworkUrl}
                  alt={episode.title}
                  fill
                  sizes={EPISODE_ARTWORK_SIZES}
                  className="object-cover"
                />
                <div className="podcast-card-overlay absolute inset-0 flex items-center justify-center transition-opacity duration-200">
                  <Button
                    size="lg"
                    onClick={() => handlePlay(episode)}
                    className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
                  >
                    <Play className="h-6 w-6 ml-1" />
                  </Button>
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
    </main>
  );
}
