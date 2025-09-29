'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [activePlayer, setActivePlayer] = useState<'live' | 'podcast'>('live');

  const playLive = () => {
    setActivePlayer('live');
    setCurrentEpisode(null);
  };

  const playPodcast = (episode: PodcastEpisode) => {
    if (!episode.id) {
      console.warn('⚠️ Episode sans ID:', episode);
      return;
    }

    // Utiliser la route dynamique Next.js
    const playbackUrl = `/api/podcast-stream/${episode.id}?ts=${Date.now()}`;

    const wrappedEpisode: PodcastEpisode = {
      ...episode,
      audioUrl: playbackUrl,
      streamProtocol: 'progressive',
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
