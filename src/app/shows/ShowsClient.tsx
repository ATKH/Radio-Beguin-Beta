'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/PlayerContext";
import type { PodcastEpisode, PodcastPlaylist } from "@/lib/podcasts";
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
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="lg"
            onClick={() => void onPlay(episode)}
            className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90"
            disabled={!episode.audioUrl}
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

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch("/api/podcasts")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
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

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      setDisplayCount(PAGE_SIZE);
    }
  }, [search, activeTags, activeTab, episodes]);

  useEffect(() => {
    const params = searchParams
      .getAll("tag")
      .map(tag => tag.trim())
      .filter(Boolean);

    const normalizedParams = params.map(tag => tag.toLowerCase()).sort();
    const key = normalizedParams.join("|");

    if (lastAppliedQueryKey.current === key) {
      return;
    }

    lastAppliedQueryKey.current = key;

    setActiveTags(prev => {
      const normalizedPrev = prev.map(tag => tag.toLowerCase()).sort();
      const isSameLength = normalizedPrev.length === normalizedParams.length;
      const isSame =
        isSameLength && normalizedPrev.every((value, index) => value === normalizedParams[index]);

      if (isSame) return prev;
      return params;
    });

    if (params.length > 0) {
      setActiveTab("all");
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTags.length > 0) {
      setShowTagPanel(true);
    }
  }, [activeTags]);

  const activeTagsLower = useMemo(
    () => activeTags.map(tag => tag.toLowerCase()),
    [activeTags]
  );

  const activeTagSet = useMemo(() => new Set(activeTagsLower), [activeTagsLower]);

  const filteredEpisodes = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return episodes.filter(ep => {
      const episodeTags = (ep.tags ?? []).map(tag => tag.toLowerCase());
      const matchesSearch = searchTerm
        ? ep.title.toLowerCase().includes(searchTerm) ||
          episodeTags.some(tag => tag.includes(searchTerm))
        : true;
      const matchesTags = activeTagsLower.length > 0
        ? activeTagsLower.every(tag => episodeTags.includes(tag))
        : true;
      return matchesSearch && matchesTags;
    });
  }, [episodes, search, activeTagsLower]);

  const items = useMemo(
    () => filteredEpisodes.slice(0, displayCount),
    [filteredEpisodes, displayCount]
  );

  const hasMore = displayCount < filteredEpisodes.length;

  const filteredPlaylists = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return playlists.filter(playlist => {
      const playlistTags = playlist.tags.map(tag => tag.toLowerCase());
      const titleMatch = searchTerm ? playlist.title.toLowerCase().includes(searchTerm) : true;
      const tagMatch = searchTerm
        ? playlistTags.some(tag => tag.includes(searchTerm))
        : true;
      const episodeMatch = searchTerm && playlist.latestEpisode
        ? playlist.latestEpisode.title.toLowerCase().includes(searchTerm)
        : false;
      const matchesSearch = searchTerm ? titleMatch || tagMatch || episodeMatch : true;
      const matchesTags = activeTagsLower.length > 0
        ? activeTagsLower.every(tag => playlistTags.includes(tag))
        : true;

      return matchesSearch && matchesTags;
    });
  }, [playlists, search, activeTagsLower]);

  const hasSearch = search.trim().length > 0;
  const hasActiveTags = activeTags.length > 0;
  const hasFilters = hasSearch || hasActiveTags;

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredEpisodes.length));
  }, [filteredEpisodes.length]);

  const handleTagClick = useCallback((tag: string, targetTab?: TabId) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(existing => existing !== tag) : [...prev, tag]
    );
    if (targetTab) {
      setActiveTab(targetTab);
      if (targetTab === "all") {
        setSearch("");
      }
    }
  }, []);

  const genreFilters = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];

    episodes.forEach(ep => {
      ep.tags?.forEach(tag => {
        if (!seen.has(tag)) {
          seen.add(tag);
          ordered.push(tag);
        }
      });
    });

    availableTags.forEach(tag => {
      if (!seen.has(tag)) {
        seen.add(tag);
        ordered.push(tag);
      }
    });

    return ordered;
  }, [episodes, availableTags]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold">Podcasts</h1>
        <div className="w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Rechercher un podcast, une émission ou un tag…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-2 text-sm rounded-lg border border-muted bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`tag-pill tag-pill-sm${isActive ? " active" : ""}`}
                >
                  {tab.label}
                </button>
                {tab.id === "playlists" && genreFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTagPanel(prev => !prev)}
                    className={`tag-pill tag-pill-sm${
                      showTagPanel || hasActiveTags ? " active" : ""
                    }`}
                  >
                    Styles
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {showTagPanel && genreFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {genreFilters.map(tag => {
            const isActive = activeTagSet.has(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag, activeTab)}
                className={`tag-pill tag-pill-xs${isActive ? " active" : ""}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          {error}
        </div>
      )}

      {activeTab === "all" && (
        <section>
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : filteredEpisodes.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucun épisode trouvé.</p>
          ) : (
            <InfiniteScroll
              dataLength={items.length}
              next={handleLoadMore}
              hasMore={hasMore}
              loader={<h4 className="text-center py-4">Chargement…</h4>}
              endMessage={
                <p className="text-center py-4 text-muted-foreground">
                  Vous avez atteint la fin.
                </p>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(episode => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    onPlay={playPodcast}
                    onTagClick={tag => handleTagClick(tag, "all")}
                    activeTagSet={activeTagSet}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </section>
      )}

      {activeTab === "playlists" && (
        <section className="space-y-6">
          {loading && playlists.length === 0 ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : filteredPlaylists.length === 0 ? (
            <p className="text-center text-muted-foreground">
              {hasFilters ? "Aucune émission ne correspond à votre recherche." : "Aucune émission disponible."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPlaylists.map(playlist => (
                <Link
                  key={playlist.id}
                  href={`/shows/playlist/${encodeURIComponent(playlist.id)}`}
                  className="group bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative w-full aspect-square">
                    <Image
                      src={playlist.artworkUrl}
                      alt={playlist.title}
                      width={300}
                      height={300}
                      className="object-cover rounded-lg"
                    />
                    {playlist.latestEpisode?.artworkUrl && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-medium text-white">
                        Voir la playlist
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="font-semibold text-sm line-clamp-2">{playlist.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {playlist.trackCount} épisode{playlist.trackCount > 1 ? 's' : ''}
                    </p>
                    {playlist.latestEpisode && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Dernier : {playlist.latestEpisode.title}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {playlist.tags.map(tag => {
                        const isActive = activeTagSet.has(tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagClick(tag, "playlists")}
                            className={`tag-pill tag-pill-xs${isActive ? " active" : ""}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
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
