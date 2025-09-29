'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/PlayerContext";
import type { PodcastEpisode, PodcastPlaylist } from "@/lib/podcasts.types";
import { useSearchParams } from "next/navigation";

type TabId = "all" | "playlists";

type ApiPayload = {
  episodes?: PodcastEpisode[];
  playlists?: PodcastPlaylist[];
  tags?: string[];
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "Tous les podcasts" },
  { id: "playlists", label: "Émissions" },
];

const PAGE_SIZE = 20;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function EpisodeCard({
  episode,
  onPlay,
  onTagClick,
  activeTagSet,
}: {
  episode: PodcastEpisode;
  onPlay: (episode: PodcastEpisode) => void;
  onTagClick: (tag: string) => void;
  activeTagSet: Set<string>;
}) {
  const isTagActive = (tag: string) => activeTagSet.has(tag.toLowerCase());

  return (
    <div className="bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200 group">
      <div className="relative w-full aspect-square">
        <Image
          src={episode.artworkUrl}
          alt={episode.title}
          width={300}
          height={300}
          className="object-cover rounded-lg"
          loading="lazy"
        />
        {/* ✅ Bouton play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="lg"
            onClick={() => onPlay(episode)}
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
        <p className="text-xs text-muted-foreground">{formatDate(episode.pubDate)}</p>
        <div className="flex flex-wrap gap-1">
          {(episode.tags ?? []).map(tag => {
            const isActive = isTagActive(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                className={`tag-pill tag-pill-xs${isActive ? " active" : ""}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ShowsClient() {
  const { playPodcast } = usePlayer();
  const searchParams = useSearchParams();
  const lastAppliedQueryKey = useRef<string | null>(null);

  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [playlists, setPlaylists] = useState<PodcastPlaylist[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTagPanel, setShowTagPanel] = useState(false);

  // ✅ Lecture avec proxy
  const handlePlay = useCallback(
    (episode: PodcastEpisode) => {
      const audioUrl = `/api/podcast-stream/${episode.id}?ts=${Date.now()}`;
      playPodcast({ ...episode, audioUrl, streamProtocol: "progressive" });
    },
    [playPodcast]
  );

  // Chargement JSON podcasts
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch("/data/podcasts.json")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((payload: ApiPayload | PodcastEpisode[]) => {
        if (!isMounted) return;
        if (Array.isArray(payload)) {
          setEpisodes(payload);
          setPlaylists([]);
          setAvailableTags([]);
        } else {
          setEpisodes(payload.episodes ?? []);
          setPlaylists(payload.playlists ?? []);
          setAvailableTags(payload.tags ?? []);
        }
      })
      .catch(err => {
        console.error("Erreur fetch podcasts:", err);
        if (isMounted) setError("Impossible de charger les podcasts");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Tags actifs depuis URL
  useEffect(() => {
    const params = searchParams.getAll("tag").map(tag => tag.trim()).filter(Boolean);
    const normalized = params.map(t => t.toLowerCase()).sort();
    const key = normalized.join("|");

    if (lastAppliedQueryKey.current !== key) {
      lastAppliedQueryKey.current = key;
      setActiveTags(params);
      if (params.length > 0) setActiveTab("all");
    }
  }, [searchParams]);

  const activeTagsLower = useMemo(() => activeTags.map(t => t.toLowerCase()), [activeTags]);
  const activeTagSet = useMemo(() => new Set(activeTagsLower), [activeTagsLower]);

  // Filtrage épisodes
  const filteredEpisodes = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return episodes.filter(ep => {
      const tags = (ep.tags ?? []).map(tag => tag.toLowerCase());
      const matchesSearch = searchTerm
        ? ep.title.toLowerCase().includes(searchTerm) || tags.some(tag => tag.includes(searchTerm))
        : true;
      const matchesTags = activeTagsLower.length > 0
        ? activeTagsLower.every(tag => tags.includes(tag))
        : true;
      return matchesSearch && matchesTags;
    });
  }, [episodes, search, activeTagsLower]);

  const items = filteredEpisodes.slice(0, displayCount);
  const hasMore = displayCount < filteredEpisodes.length;

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredEpisodes.length));
  }, [filteredEpisodes.length]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold">Podcasts</h1>
        <input
          type="text"
          placeholder="Rechercher un podcast, une émission ou un tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 pl-3 pr-3 py-2 text-sm rounded-lg border border-muted bg-muted/20 text-foreground"
        />
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`tag-pill tag-pill-sm${activeTab === tab.id ? " active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Episodes */}
      {activeTab === "all" && (
        <section>
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucun épisode trouvé.</p>
          ) : (
            <InfiniteScroll
              dataLength={items.length}
              next={handleLoadMore}
              hasMore={hasMore}
              loader={<h4 className="text-center py-4">Chargement…</h4>}
              endMessage={<p className="text-center py-4">Vous avez atteint la fin.</p>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(episode => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    onPlay={handlePlay}
                    onTagClick={() => {}}
                    activeTagSet={activeTagSet}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </section>
      )}

      {/* Playlists */}
      {activeTab === "playlists" && (
        <section>
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : playlists.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucune émission trouvée.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {playlists.map(pl => (
                <Link
                  key={pl.id}
                  href={`/shows/playlist/${encodeURIComponent(pl.id)}`}
                  className="group bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200 relative"
                >
                  <div className="relative w-full aspect-square">
                    <Image
                      src={pl.artworkUrl}
                      alt={pl.title}
                      width={300}
                      height={300}
                      className="object-cover rounded-lg"
                    />
                    {pl.latestEpisode && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="lg"
                          onClick={(e) => {
                            e.preventDefault();
                            const audioUrl = `/api/podcast-stream/${pl.latestEpisode.id}?ts=${Date.now()}`;
                            playPodcast({ ...pl.latestEpisode, audioUrl, streamProtocol: "progressive" });
                          }}
                          className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
                        >
                          <Play className="h-6 w-6 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="font-semibold text-sm line-clamp-2">{pl.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {pl.trackCount} épisode{pl.trackCount > 1 ? "s" : ""}
                    </p>
                    {pl.latestEpisode && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Dernier : {pl.latestEpisode.title}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
