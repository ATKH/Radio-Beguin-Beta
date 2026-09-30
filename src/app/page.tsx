// @ts-nocheck
import React, { cache } from "react";
import path from "path";
import { readFile } from "fs/promises";
import UpcomingShowsSection from "@/components/UpcomingShowsSection";
import SelectionSection from "@/components/SelectionSection";
import UpcomingEventsSection from "@/components/UpcomingEventsSection";
import NewsSection from "@/components/NewsSection";
import { fetchPodcastPlaylists } from "@/lib/podcasts";
import type { PodcastEpisode } from "@/lib/podcasts";
import { getUpcomingShowsSorted } from "@/lib/upcomingShows";
import { getUpcomingEvents } from "@/lib/events";
import { getAllNews } from "@/lib/news";

export const dynamic = "force-dynamic";

const PODCASTS_PATH = path.join(process.cwd(), "public/data/podcasts.json");
const SELECTION_POOL_SIZE = 96;

const normalizeTitle = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getEpisodesPool = cache(async (): Promise<PodcastEpisode[]> => {
  try {
    const raw = await readFile(PODCASTS_PATH, "utf8");
    const payload = JSON.parse(raw);
    let list: PodcastEpisode[] = Array.isArray(payload?.episodes) ? payload.episodes : [];

    list = list.sort(
      (a, b) => new Date((b as any).pubDate).getTime() - new Date((a as any).pubDate).getTime()
    );

    const trimmed = list.slice(0, SELECTION_POOL_SIZE).map(({ description, ...episode }) => ({
      ...episode,
    }));

    return trimmed;
  } catch (error) {
    console.error("Erreur lecture podcasts.json:", error);
    return [];
  }
});

export default async function Page() {
  const [upcomingShows, pool, playlists, upcomingEvents, news] = await Promise.all([
    getUpcomingShowsSorted(),
    getEpisodesPool(),
    fetchPodcastPlaylists(),
    getUpcomingEvents(),
    getAllNews(),
  ]);

  const featuredEvents = upcomingEvents.slice(0, 3);
  const hasUpcomingShows = upcomingShows && upcomingShows.length > 0;
  const hasNews = news && news.length > 0;
  const hasEvents = featuredEvents && featuredEvents.length > 0;

  // Nombre de colonnes réellement actives (Shows / News / Events) pour équilibrer la grille
  const activeColumns = [hasUpcomingShows, hasNews, hasEvents].filter(Boolean).length;
  const gridColsClass =
    activeColumns >= 3
      ? "lg:grid-cols-3"
      : activeColumns === 2
      ? "lg:grid-cols-2"
      : "lg:grid-cols-1";

  return (
    <div className="min-h-screen bg-background text-foreground max-w-7xl mx-auto px-4 md:px-8 pt-2 pb-6 md:pt-3">
      {/* Conteneur pour "Upcoming Shows", "News" et "Events" côte à côte */}
      {activeColumns > 0 && (
        <div className={`grid grid-cols-1 ${gridColsClass} gap-8 mb-6 items-start`}>
          {/* Section "Upcoming Shows" (le programme) */}
          {hasUpcomingShows && (
            <UpcomingShowsSection shows={upcomingShows} />
          )}

          {/* Section "News" */}
          {hasNews && <NewsSection news={news} />}

          {/* Section "Events" */}
          {hasEvents && <UpcomingEventsSection events={featuredEvents} />}
        </div>
      )}

      {/* Sélection */}
      <SelectionSection initialEpisodes={pool} />
    </div>
  );
}