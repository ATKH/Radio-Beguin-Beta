'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Play, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { usePlayer } from '@/lib/PlayerContext';

type PodcastEpisode = {
  id: string;
  title: string;
  pubDate: string;
  audioUrl: string;
  link: string;
  description: string;
  artworkUrl: string;
};

interface SoundCloudPlayerProps {
  hidden?: boolean;
}

const PLAYER_HEIGHT = 70;

export default function SoundCloudPlayer({ hidden = false }: SoundCloudPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentEpisode, activePlayer } = usePlayer();

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Charger l’épisode quand il change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    audio.src = currentEpisode.audioUrl;
    audio.load();
    setProgress(0);
    setDuration(0);

    // Lancer automatiquement la lecture du podcast
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentEpisode]);

  // Mettre à jour la durée quand metadata est chargée
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => audio.removeEventListener('loadedmetadata', onLoadedMetadata);
  }, [currentEpisode]);

  // Mettre à jour la progression
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  if (!currentEpisode || activePlayer !== 'podcast') return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-[var(--pink)] text-white shadow-lg z-50 transition-opacity duration-300 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={hidden}
      style={{ height: hidden ? 0 : PLAYER_HEIGHT, overflow: 'hidden' }}
    >
      <audio ref={audioRef} preload="metadata" />

      <div className="container mx-auto px-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{currentEpisode.title}</h3>
            <p className="text-xs opacity-80">
              {new Date(currentEpisode.pubDate).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <a
                href={currentEpisode.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>SoundCloud</span>
              </a>
            </Button>
            {/* Optionnel: bouton pour fermer le player si tu veux */}
            {/* <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        </div>

        <div className="flex items-center space-x-4 mt-2">
          <Button variant="ghost" size="sm" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          {/* Barre de progression rose */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={onSeek}
            step={0.1}
            className="flex-1 soundcloud-range"
            aria-label="Progression de la lecture"
          />

          <div className="text-xs w-20 text-right tabular-nums">
            {formatTime(progress)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Format mm:ss
function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
