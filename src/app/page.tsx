// @ts-nocheck
import React, { cache } from "react";
import path from "path";
import { readFile } from "fs/promises";
import UpcomingShowsSection from "@/components/UpcomingShowsSection";
import SelectionSection from "@/components/SelectionSection";
import UpcomingEventsSection from "@/components/UpcomingEventsSection";
import { fetchPodcastPlaylists } from "@/lib/podcasts";
import type { PodcastEpisode } from "@/lib/podcasts";
import { getUpcomingShowsSorted } from "@/lib/upcomingShows";
import { getUpcomingEvents } from "@/lib/events";

export const revalidate = 900;

const PODCASTS_PATH = path.join(process.cwd(), "src/data/podcasts.json");
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
  const [upcomingShows, pool, playlists, upcomingEvents] = await Promise.all([
    getUpcomingShowsSorted(),
    getEpisodesPool(),
    fetchPodcastPlaylists(),
    getUpcomingEvents(),
  ]);

  const featuredEvents = upcomingEvents.slice(0, 3);
  const hasUpcomingShows = upcomingShows && upcomingShows.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Conteneur pour les sections "Upcoming Shows" et "Events" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 items-start">
        {/* Section "Upcoming Shows" */}
        {hasUpcomingShows && (
          <UpcomingShowsSection shows={upcomingShows} />
        )}

        {/* Section "Events" - toujours à 50% de largeur, même seule */}
        <div className={hasUpcomingShows ? "" : "lg:col-start-1"}>
          <UpcomingEventsSection events={featuredEvents} />
        </div>
      </div>

      {/* Sélection */}
      <SelectionSection initialEpisodes={pool} />
    </div>
  );
}