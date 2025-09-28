'use client';

import React from 'react';
import Image from 'next/image';

type Track = {
  id: number;
  title: string;
  artwork_url?: string;
  duration?: number;
};

type PlaylistTracksClientProps = {
  tracks: Track[];
};

export default function PlaylistTracksClient({ tracks }: PlaylistTracksClientProps) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return <p className="text-center text-muted-foreground">Aucune piste disponible.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {tracks.map((track) => (
        <div key={track.id} className="bg-gray-100 rounded-lg overflow-hidden shadow hover:shadow-lg transition p-2">
          {track.artwork_url ? (
            <Image
              src={track.artwork_url.replace('-t50x50', '-t500x500')} // version haute qualité
              alt={track.title}
              width={300}
              height={300}
              className="object-cover w-full h-48"
            />
          ) : (
            <div className="w-full h-48 bg-gray-300 flex items-center justify-center text-gray-500">
              Pas d'image
            </div>
          )}
          <h2 className="mt-2 font-semibold text-lg">{track.title}</h2>
        </div>
      ))}
    </div>
  );
}
