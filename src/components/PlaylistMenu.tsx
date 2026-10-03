'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Shuffle } from 'lucide-react';
import { usePlayer } from '@/lib/PlayerContext';
import { useTheme } from '@/lib/ThemeContext';
import { getPlaylistName, startPlaylist } from '@/lib/onDemandQueue';
import {
  playlistIcon,
  playlistIconScale,
  playlistLabel,
  playlistRank,
  usePlaylistLang,
} from '@/lib/playlistMeta';
import type { PodcastEpisode } from '@/lib/podcasts';

type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioUrl: string;
  artworkUrl: string;
};

const FALLBACK_GROUP = 'Autres émissions';
const ONDEMAND_PAGE = 'https://studio.ondezero.net/public/radio_beguin/ondemand';

// En thème sombre, les singes (noirs) reçoivent un contour blanc lumineux.
// Mets false pour désactiver l'effet.
const GLOW_IN_DARK = true;
const DARK_GLOW =
  'drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff) drop-shadow(0 0 3px rgba(255,255,255,0.55))';

const TEXTS = {
  fr: {
    loading: 'Chargement…',
    error: 'Impossible de charger les playlists. Ferme puis rouvre le menu pour réessayer.',
    empty: 'Aucune playlist pour le moment.',
  },
  en: {
    loading: 'Loading…',
    error: "Couldn't load the playlists. Close and reopen the menu to try again.",
    empty: 'No playlists yet.',
  },
} as const;

// Adapte les champs si ton type PodcastEpisode en exige d'autres
const toEpisode = (t: Track) =>
  ({
    id: `az:${t.id}`,
    title: t.artist ? `${t.artist} – ${t.title}` : t.title,
    artist: t.artist, // lus par le lecteur pour afficher « Titre • Artiste »
    trackTitle: t.title,
    link: ONDEMAND_PAGE,
    pubDate: '',
    audioUrl: t.audioUrl,
    artworkUrl: t.artworkUrl,
    streamProtocol: 'progressive',
  }) as unknown as PodcastEpisode;

/** Icône singe d'une playlist ; si elle manque ou ne charge pas, petite flèche aléatoire. */
export function PlaylistIcon({ name, size = 28 }: { name: string; size?: number }) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);
  const src = playlistIcon(name);
  const imgSize = Math.round(size * playlistIconScale(name));
  const glow = GLOW_IN_DARK && theme === 'dark';
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={imgSize}
          height={imgSize}
          className="object-contain"
          style={{ width: imgSize, height: imgSize, ...(glow ? { filter: DARK_GLOW } : {}) }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Shuffle className="h-4 w-4 opacity-50" />
      )}
    </span>
  );
}

/**
 * Menu déroulant des playlists.
 * `children` = ce qui s'affiche sur le bouton qui ouvre le menu (« LIVE | heure » ou le nom de la playlist).
 */
export default function PlaylistMenu({ children }: { children: ReactNode }) {
  const { activePlayer, currentEpisode, setCurrentEpisode, setActivePlayer } = usePlayer();
  const lang = usePlaylistLang();
  const txt = TEXTS[lang];

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Chargement de la liste à la première ouverture seulement
  useEffect(() => {
    if (!open || tracks) return;
    let cancelled = false;
    fetch('/api/ondemand')
      .then((res) => {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      })
      .then((data: Track[]) => {
        if (!cancelled) setTracks(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tracks]);

  // Fermeture : clic à l'extérieur ou touche Échap
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Un groupe par genre (= nom de playlist), trié selon la langue, « Autres » toujours en dernier
  const groups = useMemo(() => {
    const map = new Map<string, Track[]>();
    (tracks ?? []).forEach((t) => {
      const key = t.genre || FALLBACK_GROUP;
      map.set(key, [...(map.get(key) ?? []), t]);
    });
    return [...map.entries()].sort(([a], [b]) => {
      const byRank = playlistRank(a) - playlistRank(b);
      if (byRank !== 0) return byRank;
      return playlistLabel(a, lang).localeCompare(playlistLabel(b, lang), lang);
    });
  }, [tracks, lang]);

  const playingName =
    activePlayer === 'podcast' && currentEpisode?.id?.startsWith('az:') ? getPlaylistName() : null;

  const launch = (name: string, list: Track[]) => {
    const first = startPlaylist(list.map(toEpisode), undefined, name);
    if (first) {
      setCurrentEpisode(first);
      setActivePlayer('podcast'); // fait passer la barre du direct au mode épisode
    }
    setOpen(false);
  };

  const toggle = () => {
    if (!open) setError(false);
    setOpen((v) => !v);
  };

  const statusText = error ? txt.error : !tracks ? txt.loading : groups.length === 0 ? txt.empty : null;

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={toggle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex cursor-pointer items-center gap-2"
        // Soulignement (couleur du texte : noir en thème clair, blanc en thème sombre).
        // En style direct pour passer devant le style global des boutons.
        style={{
          background: 'transparent',
          borderTop: 0,
          borderLeft: 0,
          borderRight: 0,
          borderBottom: `${open || focused ? 2 : 1}px solid currentColor`,
          borderRadius: 0,
          boxShadow: 'none',
          outline: 'none',
          padding: '4px 0',
        }}
      >
        {children}
        <ChevronDown
          className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[60vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border border-[var(--primary)]/25 bg-[var(--background)] shadow-lg">
          <ul>
            {statusText ? (
              <li>
                <p className="px-4 py-3 text-sm opacity-70">{statusText}</p>
              </li>
            ) : (
              groups.map(([name, list]) => {
                const isCurrent = playingName === name;
                return (
                  <li key={name} className="border-b border-[var(--primary)]/10 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => launch(name, list)}
                      aria-current={isCurrent ? 'true' : undefined}
                      className="group flex w-full items-center gap-3 !rounded-none !border-0 !bg-transparent !shadow-none px-4 py-2 text-left"
                      style={{ outline: 'none' }}
                    >
                      <PlaylistIcon key={name} name={name} />
                      <span
                        className={`min-w-0 flex-1 truncate py-0.5 text-sm underline-offset-4 decoration-1 group-hover:underline group-focus-visible:underline ${
                          isCurrent ? 'font-semibold underline' : 'font-medium'
                        }`}
                      >
                        {playlistLabel(name, lang)}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}