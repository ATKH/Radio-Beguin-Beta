'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

type PodcastEpisode = {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl: string;
  tags?: string[];
};

type Props = {
  episode: PodcastEpisode;
  onPlay?: () => void;
};

export default function PodcastCover({ episode, onPlay }: Props) {
  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-lg group">
      {/* Image */}
      <Image
        src={episode.artworkUrl}
        alt={episode.title}
        fill
        className="object-cover rounded-lg"
        priority
      />

      {/* Play Button overlay */}
      {onPlay && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="lg"
            onClick={onPlay}
            className="rounded-full h-16 w-16 bg-jungle-green hover:bg-jungle-accent"
          >
            <Play className="h-6 w-6 ml-1" />
          </Button>
        </div>
      )}

      {/* Tags overlay */}
      {episode.tags && episode.tags.length > 0 && (
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {episode.tags.map(tag => (
            <span
              key={tag}
              className="text-xs bg-jungle-accent/20 text-jungle-accent px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
