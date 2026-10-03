import type { PodcastEpisode } from '@/lib/podcasts';

// File d'attente de la playlist à la demande en cours.
// Mélangée à chaque lancement, elle se remélange toute seule quand elle arrive au bout (lecture infinie).

let pool: PodcastEpisode[] = []; // tous les épisodes de la playlist
let queue: PodcastEpisode[] = []; // ordre de lecture en cours
let position = 0; // index de l'épisode en cours dans `queue`
let playlistName = ''; // nom de la playlist en cours (affiché dans le lecteur)

export const getPlaylistName = () => playlistName;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const withPlayRequest = (episode: PodcastEpisode): PodcastEpisode =>
  ({ ...episode, playRequestId: Date.now() }) as PodcastEpisode;

// Garde toujours au moins un épisode d'avance (pour le préchargement)
function ensureAhead() {
  if (queue.length - position >= 2 || pool.length === 0) return;
  const last = queue[queue.length - 1];
  const cycle = shuffle(pool);
  // évite de rejouer deux fois de suite le même titre au changement de tour
  if (cycle.length > 1 && last && cycle[0].id === last.id) {
    [cycle[0], cycle[1]] = [cycle[1], cycle[0]];
  }
  queue = [...queue.slice(position), ...cycle];
  position = 0;
}

/** Démarre une playlist mélangée. Si firstId est donné, cet épisode passe en premier. */
export function startPlaylist(
  episodes: PodcastEpisode[],
  firstId?: string,
  name = ''
): PodcastEpisode | null {
  pool = episodes;
  playlistName = name;
  if (pool.length === 0) return null;
  const first = firstId ? pool.find((e) => e.id === firstId) : undefined;
  const rest = shuffle(pool.filter((e) => e.id !== first?.id));
  queue = first ? [first, ...rest] : rest;
  position = 0;
  ensureAhead();
  return withPlayRequest(queue[0]);
}

/** Épisode suivant, appelé quand celui en cours (currentId) se termine. */
export function nextEpisode(currentId: string): PodcastEpisode | null {
  if (pool.length === 0 || queue[position]?.id !== currentId) return null;
  position += 1;
  ensureAhead();
  return withPlayRequest(queue[position]);
}

/** Épisode qui viendra ensuite, pour le précharger (sans avancer dans la file). */
export function peekNext(currentId: string): PodcastEpisode | null {
  if (pool.length === 0 || queue[position]?.id !== currentId) return null;
  return queue[position + 1] ?? null;
}

/** Titre et artiste de l'épisode en cours (pour l'affichage dans le lecteur). */
export type OnDemandMeta = { artist: string; trackTitle: string };

export function getOnDemandMeta(episode: PodcastEpisode | null): OnDemandMeta | null {
  if (!episode?.id?.startsWith('az:')) return null;
  const extra = episode as unknown as Partial<OnDemandMeta>;
  return { artist: extra.artist ?? '', trackTitle: extra.trackTitle ?? episode.title };
}