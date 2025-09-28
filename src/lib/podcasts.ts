import { readFile } from "fs/promises";
import path from "path";
import type { PodcastAggregatedData, PodcastEpisode } from "./podcasts.types";

const CACHE_FILE = path.join(process.cwd(), "src/data/podcasts.json");
const CACHE_TTL_MS = 60_000; // 1 minute en mémoire

let memoryCache: { data: PodcastAggregatedData; loadedAt: number } | null = null;

const EMPTY_DATA: PodcastAggregatedData = { episodes: [], playlists: [], tags: [] };

async function loadCache(force = false): Promise<PodcastAggregatedData> {
  const now = Date.now();
  if (!force && memoryCache && now - memoryCache.loadedAt < CACHE_TTL_MS) {
    return memoryCache.data;
  }

  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as PodcastAggregatedData;
    memoryCache = { data: parsed, loadedAt: now };
    return parsed;
  } catch (error) {
    console.warn("⚠️ Impossible de lire le cache podcasts (utilisation de valeurs vides)", error);
    memoryCache = { data: EMPTY_DATA, loadedAt: now };
    return EMPTY_DATA;
  }
}

export async function fetchAggregatedPodcastData({ force = false }: { force?: boolean } = {}) {
  return loadCache(force);
}

export async function fetchLatestEpisodes(limit = 12): Promise<PodcastEpisode[]> {
  const data = await loadCache(false);
  return data.episodes.slice(0, limit);
}

export async function fetchPodcastEpisodes({ force = false }: { force?: boolean } = {}) {
  const data = await loadCache(force);
  return data.episodes;
}

export async function fetchPodcastPlaylists({ force = false }: { force?: boolean } = {}) {
  const data = await loadCache(force);
  return data.playlists;
}

export function collectEpisodeTags(episodes: PodcastEpisode[]): string[] {
  const tagSet = new Set<string>();
  episodes.forEach(episode => {
    episode.tags?.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export type { PodcastEpisode, PodcastPlaylist, PodcastAggregatedData } from "./podcasts.types";
