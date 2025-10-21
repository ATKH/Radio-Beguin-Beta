'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PodcastEpisode } from '@/lib/podcasts';

type PlayerContextType = {
  currentEpisode: PodcastEpisode | null;
  activePlayer: 'live' | 'podcast';
  setCurrentEpisode: (episode: PodcastEpisode | null) => void;
  setActivePlayer: (player: 'live' | 'podcast') => void;
  playLive: () => void;
  playPodcast: (episode: PodcastEpisode) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const PLAYER_STORAGE_KEY = 'radio-beguin:player-state';

type StoredEpisode = Omit<PodcastEpisode, 'audioUrl'> | null;
type StoredPayload = {
  activePlayer: 'live' | 'podcast';
  episode: StoredEpisode;
};
type StoredPlayerState = StoredPayload | null;

const serializeEpisode = (episode: PodcastEpisode | null): StoredEpisode => {
  if (!episode) return null;
  const { audioUrl: _ignored, ...rest } = episode;
  return rest;
};

const reviveEpisode = (raw: StoredEpisode): PodcastEpisode | null => {
  if (!raw || !raw.id) return null;
  const { audioUrl: _ignored, streamProtocol, ...rest } = raw as PodcastEpisode;
  return {
    ...rest,
    streamProtocol: streamProtocol ?? 'progressive',
    audioUrl: `/api/podcast-stream/${raw.id}?ts=${Date.now()}`,
  };
};

const loadStoredState = (): StoredPlayerState => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPlayerState;
    if (!parsed || (parsed.activePlayer !== 'live' && parsed.activePlayer !== 'podcast')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const persistState = (state: StoredPlayerState) => {
  if (typeof window === 'undefined') return;
  try {
    if (!state) {
      window.sessionStorage.removeItem(PLAYER_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // silent fail
  }
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [activePlayer, setActivePlayer] = useState<'live' | 'podcast'>('live');
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    const stored = loadStoredState();
    if (stored) {
      if (stored.activePlayer === 'podcast') {
        const revived = reviveEpisode(stored.episode);
        if (revived) {
          setCurrentEpisode(revived);
          setActivePlayer('podcast');
        } else {
          setActivePlayer('live');
        }
      } else {
        setActivePlayer('live');
      }
    }
    restoredRef.current = true;
  }, []);

  useEffect(() => {
    persistState({
      activePlayer,
      episode: serializeEpisode(currentEpisode),
    });
  }, [activePlayer, currentEpisode]);

  const playLive = () => {
    setActivePlayer('live');
    setCurrentEpisode(null);
  };

  const playPodcast = (episode: PodcastEpisode) => {
    if (!episode.id) {
      console.warn('⚠️ Episode sans ID:', episode);
      return;
    }

    // ⚡️ On passe toujours par notre API interne qui gère les tokens SoundCloud
    const playbackUrl = `/api/podcast-stream/${episode.id}?ts=${Date.now()}`;

    const wrappedEpisode: PodcastEpisode = {
      ...episode,
      audioUrl: playbackUrl,
    };

    setCurrentEpisode(wrappedEpisode);
    setActivePlayer('podcast');
  };

  return (
    <PlayerContext.Provider
      value={{
        currentEpisode,
        activePlayer,
        setCurrentEpisode,
        setActivePlayer,
        playLive,
        playPodcast,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
