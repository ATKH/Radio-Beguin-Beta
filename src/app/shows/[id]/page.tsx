import { notFound } from "next/navigation";
import ShowClient from "./ShowClient";
import { fetchPodcastEpisodes, fetchPodcastPlaylists } from "@/lib/podcasts";
import type { PodcastEpisode, PodcastPlaylist } from "@/lib/podcasts";

type ShowPageProps = {
  params: Promise<{ id: string }>;
};

const MOOD_TAGS = [
  "Talk",
  "Meditation Core",
  "Métro Boulot",
  "Curiosités",
  "Bain de Soleil",
  "Crépuscule",
  "Appels de Phares",
  "Abysses",
];

const normalizeTag = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const MOOD_KEYS = new Set(MOOD_TAGS.map(tag => normalizeTag(tag)));

const getMoodKey = (tags?: string[] | null) => {
  if (!Array.isArray(tags)) return null;
  for (const tag of tags) {
    const key = normalizeTag(tag);
    if (MOOD_KEYS.has(key)) return key;
  }
  return null;
};

export default async function ShowPage({ params }: ShowPageProps) {
  const { id } = await params;
  const episodeId = decodeURIComponent(id);

  // Appel direct à la lib => pas besoin de passer par /api/podcasts
  const [episodes, playlists] = await Promise.all([
    fetchPodcastEpisodes(),
    fetchPodcastPlaylists(),
  ]);
  const episode = episodes.find(ep => ep.id === episodeId);

  if (!episode) return notFound();

  const episodesById = new Map(episodes.map(ep => [ep.id, ep]));
  const recommended: PodcastEpisode[] = [];
  const added = new Set<string>();
  let parentPlaylist: PodcastPlaylist | null = null;

  const pushEpisode = (candidateId: string) => {
    if (!candidateId || candidateId === episodeId || added.has(candidateId)) return false;
    const candidate = episodesById.get(candidateId);
    if (!candidate) return false;
    recommended.push(candidate);
    added.add(candidateId);
    return true;
  };

  const pushFromList = (ids: string[]) => {
    for (const candidateId of ids) {
      if (recommended.length >= 4) break;
      pushEpisode(candidateId);
    }
  };

  const currentMoodKey = getMoodKey(episode.tags);
  const samePlaylistSameMood: string[] = [];
  const samePlaylistOtherMood: string[] = [];
  const samePlaylistEpisodeIds = new Set<string>();

  // 1. Episodes de la même playlist (même mood en priorité)
  playlists.forEach(pl => {
    if (pl.episodeIds.includes(episodeId)) {
      if (!parentPlaylist) parentPlaylist = pl;
      pl.episodeIds.forEach(candidateId => {
        if (candidateId === episodeId) return;
        samePlaylistEpisodeIds.add(candidateId);
        const candidate = episodesById.get(candidateId);
        if (!candidate) return;
        const candidateMoodKey = getMoodKey(candidate.tags);
        if (currentMoodKey && candidateMoodKey === currentMoodKey) {
          samePlaylistSameMood.push(candidateId);
        } else {
          samePlaylistOtherMood.push(candidateId);
        }
      });
    }
  });

  pushFromList(samePlaylistSameMood);
  pushFromList(samePlaylistOtherMood);

  // 2. Episodes partageant le même mood mais provenant d'autres playlists
  if (recommended.length < 4 && currentMoodKey) {
    const sameMoodOtherPlaylist: string[] = [];
    for (const other of episodes) {
      if (other.id === episodeId || samePlaylistEpisodeIds.has(other.id)) continue;
      if (getMoodKey(other.tags) === currentMoodKey) {
        sameMoodOtherPlaylist.push(other.id);
      }
    }
    pushFromList(sameMoodOtherPlaylist);
  }

  // 3. Episodes partageant un tag
  if (recommended.length < 4 && episode.tags?.length) {
    const tagSet = new Set(episode.tags.map(tag => tag.toLowerCase()));
    for (const other of episodes) {
      if (recommended.length >= 4) break;
      if (other.id === episodeId) continue;
      const matchesTag = other.tags?.some(tag => tagSet.has(tag.toLowerCase()));
      if (matchesTag) pushEpisode(other.id);
    }
  }

  // 4. Compléter avec les épisodes les plus récents
  if (recommended.length < 4) {
    for (const other of episodes) {
      if (recommended.length >= 4) break;
      pushEpisode(other.id);
    }
  }

  return <ShowClient episode={episode} recommended={recommended.slice(0, 4)} parentPlaylist={parentPlaylist} />;
}
