'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/lib/PlayerContext';
import type { PodcastEpisode } from '@/lib/podcasts';

interface PlayButtonProps {
  episode: PodcastEpisode;
  className?: string;
}

export default function PlayButton({ episode, className }: PlayButtonProps) {
  const { playPodcast } = usePlayer();

  const handleClick = () => {
    console.log("🎧 Bouton Play cliqué avec épisode:", {
      id: episode.id,
      title: episode.title,
      audioUrl: episode.audioUrl,
    });
    playPodcast(episode);
  };

  return (
    <Button
      onClick={handleClick}
      className={`rounded-full h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90 ${className || ''}`}
    >
      <Play className="h-5 w-5 ml-0.5" />
    </Button>
  );
}
