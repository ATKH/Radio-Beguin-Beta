// @ts-nocheck
import React, { cache } from "react";
import path from "path";
import { readFile } from "fs/promises";
import WeeklySchedule, { WeeklyScheduleConfig } from "@/components/WeeklySchedule";
import SelectionSection from "@/components/SelectionSection";
import { fetchPodcastPlaylists } from "@/lib/podcasts";
import type { PodcastEpisode } from "@/lib/podcasts";

export const dynamic = "force-dynamic";

const WEEKLY_SCHEDULE: WeeklyScheduleConfig = {
  Lundi: [
    { time: "00h", label: "Playlist Nuit" },
    { time: "05h", label: "Playlist Ambient" },
    { time: "07h", label: "Playlist Matin" },
    { time: "13h", label: "Playlist Journée" },
  ],
  Mardi: [
    { time: "00h", label: "Playlist Nuit" },
    { time: "05h", label: "Playlist Ambient" },
    { time: "07h", label: "Playlist Matin" },
    { time: "13h", label: "Playlist Journée" },
  ],
  Mercredi: [
    { time: "00h", label: "Playlist Nuit" },
    { time: "05h", label: "Playlist Ambient" },
    { time: "07h", label: "Playlist Matin" },
    { time: "13h", label: "Playlist Journée" },
  ],
  Jeudi: [
    { time: "00h", label: "Playlist Nuit" },
    { time: "05h", label: "Playlist Ambient" },
    { time: "07h", label: "Playlist Matin" },
    { time: "13h", label: "Playlist Journée" },
    { time: "19h", label: "Carnavália Sounds • DJ âMy B. invite Discolada", highlight: true },
    { time: "21h", label: "Playlist Soirée" },  ],
  Vendredi: [
    { time: "00h", label: "Playlist Soirée" },
    { time: "01h", label: "Playlist Nuit" },
    { time: "05h", label: "Playlist Ambient" },
    { time: "07h", label: "Playlist Matin" },
    { time: "13h", label: "Playlist Journée" },
    { time: "21h", label: "Playlist Soirée" },
  ],
  Samedi: [
    { time: "00h", label: "Playlist Soirée" },
    { time: "01h", label: "Playlist Nuit" },
    { time: "05h", label: "Playlist Ambient" },
    { time: "07h", label: "Playlist Matin" },
    { time: "13h", label: "Playlist Journée" },
    { time: "14h", label: "Ça Jacte • Clarisse Teyssandier", highlight: true },
    { time: "21h", label: "Playlist Soirée" },
  ],
  Dimanche: [
    { time: "00h", label: "Playlist Soirée" },
    { time: "01h", label: "Playlist Nuit" },
    { time: "05h", label: "Playlist Ambient" },
    { time: "08h", label: "Playlist Matin" },
    { time: "13h", label: "Playlist Journée" },
    { time: "15h", label: "Événement : Mangez Bougez au Grrrd Zero"},
  ],
};

const PODCASTS_PATH = path.join(process.cwd(), "src/data/podcasts.json");

// ✅ On prend les 200 épisodes les plus récents grâce à pubDate
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

    // Tri du plus récent au plus ancien
    list = list.sort(
      (a, b) => new Date((b as any).pubDate).getTime() - new Date((a as any).pubDate).getTime()
    );

    // On garde une fenêtre raisonnable d'épisodes récents pour la sélection
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
  const [pool, playlists] = await Promise.all([getEpisodesPool(), fetchPodcastPlaylists()]);

  const highlightTargets = playlists.reduce<Record<string, string>>((acc, playlist) => {
    if (!playlist?.title || !playlist.id) return acc;
    const key = normalizeTitle(playlist.title);
    if (!key || acc[key]) return acc;
    acc[key] = playlist.id;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Programme hebdo */}
      <section className="mb-8">
        <WeeklySchedule schedule={WEEKLY_SCHEDULE} highlightTargets={highlightTargets} />
      </section>

      {/* Sélection : 8 épisodes tirés des 200 plus récents */}
      <SelectionSection initialEpisodes={pool} />
    </div>
  );
}
