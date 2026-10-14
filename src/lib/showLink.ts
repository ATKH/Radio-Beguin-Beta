import { useEffect, useState } from 'react';

type Entry = { id: string; key: string };
type ShowData = { playlists: Entry[]; episodes: Entry[] };

// Même normalisation que la recherche de la page Shows
const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Les listes sont lues une seule fois (le même fichier que la page Shows)
let dataPromise: Promise<ShowData> | null = null;

const toEntries = (list: unknown): Entry[] =>
  (Array.isArray(list) ? list : [])
    .filter((p: any) => p?.id !== undefined && typeof p?.title === 'string')
    .map((p: any) => ({ id: String(p.id), key: normalizeText(p.title) }))
    .filter((p) => p.key.length > 0);

function loadData(): Promise<ShowData> {
  if (!dataPromise) {
    dataPromise = fetch('/data/podcasts.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload) return { playlists: [], episodes: [] };
        if (Array.isArray(payload)) return { playlists: [], episodes: toEntries(payload) };
        return { playlists: toEntries(payload.playlists), episodes: toEntries(payload.episodes) };
      })
      .catch(() => {
        dataPromise = null; // on pourra réessayer plus tard
        return { playlists: [], episodes: [] } as ShowData;
      });
  }
  return dataPromise;
}

// Table de secours : si une émission ou un épisode n'est pas reconnu tout seul, ajoute-le ici.
// match = un morceau du titre tel qu'il s'affiche dans la barre (sans accents ni majuscules),
// href = la page à ouvrir.
const MANUAL_LINKS: Array<{ match: string; href: string }> = [
  { match: 'gueule de bois sentimentale', href: '/shows/playlist/1523940535' },
];

// Nombre de lettres à changer/ajouter/retirer pour passer d'un mot à l'autre (pour les fautes de frappe)
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

const typoTolerance = (len: number) => Math.max(1, Math.floor(len * 0.12));

/** Titre identique, à une petite faute de frappe près. Une seule correspondance, sinon rien. */
function matchTitle(target: string, entries: Entry[]): string | null {
  if (!target) return null;
  const exact = entries.filter((e) => e.key === target);
  if (exact.length === 1) return exact[0].id;
  if (exact.length > 1) return null;

  const typo = entries.filter((e) => {
    const longest = Math.max(e.key.length, target.length);
    return longest >= 8 && editDistance(e.key, target) <= typoTolerance(longest);
  });
  return typo.length === 1 ? typo[0].id : null;
}

/**
 * Retrouve la page correspondant au titre affiché dans la barre.
 *  1. table de secours ;
 *  2. l'épisode exact (« Scrambled Eggs (juin 2024) ») -> /shows/<épisode> ;
 *  3. sinon l'émission (« Scrambled Eggs ») -> /shows/playlist/<émission>.
 * Prudent : en cas de doute, aucun lien.
 */
export function findShowHref(title: string, data: ShowData): string | null {
  const full = normalizeText(title);
  const short = normalizeText(title.replace(/\([^)]*\)|\[[^\]]*\]/g, ' '));
  if (!short && !full) return null;

  const manual = MANUAL_LINKS.find((m) => short.includes(m.match) || full.includes(m.match));
  if (manual) return manual.href;

  const episodeId = matchTitle(full, data.episodes);
  if (episodeId) return `/shows/${encodeURIComponent(episodeId)}`;

  // L'épisode dont le titre commence par celui de la barre, sans la date
  // (« Saint-Gilles Reggae Club #13 » -> « Saint-Gilles Reggae Club #13 - Grégoire Bruno (15.03.22) »).
  // Seulement si le titre porte un numéro et qu'un seul épisode correspond.
  if (short.length >= 8 && /\d/.test(short)) {
    const starts = data.episodes.filter((e) => e.key === short || e.key.startsWith(`${short} `));
    if (starts.length === 1) return `/shows/${encodeURIComponent(starts[0].id)}`;
  }

  let playlistId = matchTitle(short, data.playlists) ?? matchTitle(full, data.playlists);
  if (!playlistId) {
    // Un nom contient l'autre, à condition qu'ils soient assez proches
    const close = data.playlists.filter((s) => {
      const [a, b] = s.key.length <= short.length ? [s.key, short] : [short, s.key];
      return a.length >= 6 && b.includes(a) && a.length / b.length >= 0.6;
    });
    if (close.length === 1) playlistId = close[0].id;
  }
  return playlistId ? `/shows/playlist/${encodeURIComponent(playlistId)}` : null;
}

/** Adresse de la page de l'épisode ou de l'émission en cours, ou null si rien ne correspond. */
export function useShowLink(title: string | undefined | null, enabled = true): string | null {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!enabled || !title) {
      setHref(null);
      return;
    }
    loadData().then((data) => {
      if (!cancelled) setHref(findShowHref(title, data));
    });
    return () => {
      cancelled = true;
    };
  }, [title, enabled]);

  return href;
}