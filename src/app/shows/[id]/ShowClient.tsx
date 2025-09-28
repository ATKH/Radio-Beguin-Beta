"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import BackLink from "@/components/BackLink";
import type { PodcastEpisode } from "@/lib/podcasts";
import { usePlayer } from "@/lib/PlayerContext";

type ShowClientProps = {
  episode: PodcastEpisode;
};

export default function ShowClient({ episode }: ShowClientProps) {
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

  const publicationDate = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(episode.pubDate));

  return (
    <div className="flex flex-col gap-6">
      <BackLink label="Retour aux podcasts" href="/shows" />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Artwork + bouton play */}
        <div className="relative w-full md:w-1/3 aspect-square">
          <Image
            src={
              episode.artworkUrl?.replace("-large", "-t500x500") ||
              "/default-artwork.jpg"
            }
            alt={episode.title}
            width={500}
            height={500}
            className="object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center">
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
          <h1 className="text-3xl font-bold mb-4">{episode.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {publicationDate}
          </p>
          {episode.description && (
            <div className="prose dark:prose-invert mb-4 whitespace-pre-line">
              {episode.description}
            </div>
          )}
          <a
            href={episode.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Aller à la source
          </a>
        </div>
      </div>
    </div>
  );
}
