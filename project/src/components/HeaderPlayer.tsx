'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Menu, X, Play, Pause, ExternalLink } from 'lucide-react';

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
  episode: PodcastEpisode | null;
  onClose: () => void;
  hidden?: boolean;
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-pink-500">
      <div className="container mx-auto px-4 h-[70px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="Radio Béguin" className="h-12 w-auto" />
        </Link>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          {['Live', 'Programme', 'Émissions', 'Playlists', 'À propos'].map((item) => (
            <Link
              key={item}
              href={`/#${item.toLowerCase()}`}
              className="text-pink-500 font-semibold hover:opacity-80 transition-opacity"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Menu mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5 text-pink-500" /> : <Menu className="h-5 w-5 text-pink-500" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-pink-500">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {['Live', 'Programme', 'Émissions', 'Playlists', 'À propos'].map((item) => (
              <Link
                key={item}
                href={`/#${item.toLowerCase()}`}
                className="text-pink-500 font-semibold hover:opacity-80 transition-opacity"
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SoundCloudPlayer({ episode, onClose, hidden = false }: SoundCloudPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!episode || !audioRef.current) return;
    audioRef.current.src = episode.audioUrl;
    audioRef.current.load();
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [episode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => audio.removeEventListener('loadedmetadata', onLoadedMetadata);
  }, [episode]);

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

  if (!episode) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-pink-500 shadow-lg z-50 transition-opacity duration-300 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ height: hidden ? 0 : 'auto', overflow: 'hidden' }}
    >
      <audio ref={audioRef} preload="metadata" />
      <div className="container mx-auto px-4 py-3 flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-5 w-5 text-pink-500" /> : <Play className="h-5 w-5 text-pink-500" />}
        </Button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          onChange={onSeek}
          step={0.1}
          className="flex-1"
        />
        <div className="text-xs w-20 text-right tabular-nums text-pink-500">
          {formatTime(progress)} / {formatTime(duration)}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5 text-pink-500" />
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={episode.link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-5 w-5 text-pink-500" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ✅ Exemple d’épisode test pour que le player fonctionne
export const exampleEpisode: PodcastEpisode = {
  id: '1',
  title: 'Episode test',
  pubDate: '2025-09-18',
  audioUrl: '/test-audio.mp3', // remplace par un vrai mp3
  link: 'https://example.com',
  description: 'Description de l’épisode test.',
  artworkUrl: '/logo.svg',
};
