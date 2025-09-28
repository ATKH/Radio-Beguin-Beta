"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/PlayerContext";
import { PodcastEpisode } from "@/lib/podcasts";

type ShowClientProps = {
  episode: PodcastEpisode;
};

export default function ShowClient({ episode }: ShowClientProps) {
  const { playPodcast } = usePlayer();

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-1/3 aspect-square">
          <Image
            src={episode.artworkUrl}
            alt={episode.title}
            width={500}
            height={500}
            className="object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              onClick={() => playPodcast(episode)}
              className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
            >
              <Play className="h-6 w-6 ml-1" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <h1 className="text-3xl font-bold mb-4">{episode.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {new Date(episode.pubDate).toLocaleDateString()}
          </p>
          {episode.description && (
            <div className="prose dark:prose-invert mb-4">
              <p>{episode.description}</p>
            </div>
          )}
          <Link
            href={episode.link}
            target="_blank"
            className="text-primary hover:underline"
          >
            Aller à la source
          </Link>
        </div>
      </div>
    </main>
  );
}
