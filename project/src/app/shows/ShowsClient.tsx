"use client";

import React, { useState, useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/PlayerContext";
import { PodcastEpisode } from "@/lib/podcasts";

type ShowsClientProps = {
  episodes: PodcastEpisode[];
};

export default function ShowsClient({ episodes }: ShowsClientProps) {
  const PAGE_SIZE = 20;
  const { playPodcast } = usePlayer();

  const [displayCount, setDisplayCount] = useState(
    Math.min(PAGE_SIZE, episodes.length)
  );
  const [search, setSearch] = useState("");

  const filteredEpisodes = useMemo(
    () =>
      episodes.filter(
        (ep) =>
          ep.title.toLowerCase().includes(search.toLowerCase()) ||
          ep.tags?.some((tag) =>
            tag.toLowerCase().includes(search.toLowerCase())
          )
      ),
    [episodes, search]
  );

  const items = filteredEpisodes.slice(0, displayCount);
  const hasMore = displayCount < filteredEpisodes.length;

  const fetchMoreData = () =>
    setDisplayCount((prev) =>
      Math.min(prev + PAGE_SIZE, filteredEpisodes.length)
    );

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Épisodes</h1>

      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Rechercher un podcast ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-3 py-1.5 text-sm rounded-lg border border-muted bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
          />
        </div>
      </div>

      <InfiniteScroll
        dataLength={items.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={<h4 className="text-center py-4">Chargement...</h4>}
        endMessage={
          <p className="text-center py-4 text-muted-foreground">
            Vous avez atteint la fin.
          </p>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((episode) => (
            <div
              key={episode.id}
              className="bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200 group"
            >
              <div className="relative w-full aspect-square">
                <Image
                  src={episode.artworkUrl}
                  alt={episode.title}
                  width={300}
                  height={300}
                  className="object-cover rounded-lg"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    size="lg"
                    onClick={() => playPodcast(episode)}
                    className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
                  >
                    <Play className="h-6 w-6 ml-1" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <Link
                  href={`/shows/${encodeURIComponent(episode.id)}`}
                  className="block font-semibold text-sm hover:underline line-clamp-2"
                  title={episode.title}
                >
                  {episode.title}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1">
                  {episode.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </main>
  );
}
