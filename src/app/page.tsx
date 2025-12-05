// @ts-nocheck
import React, { cache } from "react";
import path from "path";
import { readFile } from "fs/promises";
import WeeklySchedule, { WeeklyScheduleConfig } from "@/components/WeeklySchedule";
import SelectionSection from "@/components/SelectionSection";
import { fetchPodcastPlaylists } from "@/lib/podcasts";
import type { PodcastEpisode } from "@/lib/podcasts";

export const revalidate = 900;

const SCHEDULE_LABELS = {
  night: { fr: "Playlist de la nuit", en: "Night time playlist" },
  ambient: { fr: "Playlist méditative", en: "Meditative playlist" },
  morning: { fr: "Playlist plutôt tranquille", en: "Rather calm playlist" },
  day: { fr: "Playlist un peu moins tranquille", en: "Slightly less calm playlist" },
  evening: { fr: "Playlist un peu plus club", en: "Club-oriented playlist" },
} satisfies Record<string, { fr: string; en: string }>;

const makeSlot = (time: string, key: keyof typeof SCHEDULE_LABELS) => ({
  time,
  label: SCHEDULE_LABELS[key].fr,
  translations: { en: SCHEDULE_LABELS[key].en },
});

const WEEKLY_SCHEDULE: WeeklyScheduleConfig = {
  Lundi: [
    makeSlot("00h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
  ],
  Mardi: [
    makeSlot("00h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
  ],
  Mercredi: [
    makeSlot("00h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
  ],
  Jeudi: [
    makeSlot("00h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
    makeSlot("21h", "evening"),
  ],
  Vendredi: [
    makeSlot("00h", "evening"),
    makeSlot("01h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
    makeSlot("21h", "evening"),
  ],
  Samedi: [
    makeSlot("00h", "evening"),
    makeSlot("01h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
    { time: "14h", label: "Ça Jacte • Clarisse Teyssandier", highlight: true },
    makeSlot("15h", "day"),
    makeSlot("21h", "evening"),
  ],
  Dimanche: [
    makeSlot("00h", "evening"),
    makeSlot("01h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("08h", "morning"),
    makeSlot("13h", "day"),
    makeSlot("18h", "morning"),
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
