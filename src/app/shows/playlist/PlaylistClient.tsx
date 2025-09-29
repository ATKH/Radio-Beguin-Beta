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

export default function PlaylistClient({ playlist, episodes }: PlaylistClientProps) {
  const { playPodcast } = usePlayer();
  const latestEpisode = episodes[0]; // 🔥 dernier épisode

  const handlePlay = (episode: PodcastEpisode) => {
    const audioUrl = `/api/podcast-stream/${episode.id}?ts=${Date.now()}`;
    playPodcast({ ...episode, audioUrl, streamProtocol: "progressive" });
  };

  return (
    <div className="space-y-8">
      <BackLink label="Retour aux podcasts" href="/shows" />

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* ✅ Image avec bouton Play */}
        <div className="relative w-full max-w-xs mx-auto md:mx-0 aspect-square">
          <Image
            src={playlist.artworkUrl}
            alt={playlist.title}
            width={400}
            height={400}
            className="object-cover rounded-lg"
          />
          {latestEpisode && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
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
          <h1 className="text-4xl font-bold mb-2">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line max-w-2xl mb-4">
              {playlist.description}
            </p>
          )}
          {playlist.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {playlist.tags.map((tag) => (
                <span key={tag} className="tag-pill tag-pill-xs">
                  {tag}
                </span>
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
        {episodes.map((episode) => (
          <div
            key={episode.id}
            className="group bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={episode.artworkUrl}
                alt={episode.title}
                width={300}
                height={300}
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="lg"
                  onClick={() => handlePlay(episode)}
                  className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <Link
                href={`/shows/${encodeURIComponent(episode.id)}`}
                className="block font-semibold text-sm hover:underline line-clamp-2"
                title={episode.title}
              >
                {episode.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {new Date(episode.pubDate).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
