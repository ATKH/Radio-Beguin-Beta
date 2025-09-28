'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface PlayButtonProps {
  episode: PodcastEpisode;
  className?: string; // <- ajouté
}

export default function PlayButton({ episode, className }: PlayButtonProps) {
  const { playPodcast } = usePlayer();

  return (
    <Button
      onClick={() => playPodcast(episode)}
      className={`rounded-full h-12 w-12 ${className || ''}`} // <- applique className si fourni
    >
      <Play className="h-5 w-5 ml-0.5" />
    </Button>
  );
}
