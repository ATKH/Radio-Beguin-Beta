'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Playlist = {
  id: number;
  title: string;
  artwork_url: string;
  tracks: any[];
};

type PlaylistsClientProps = {
  playlists: Playlist[];
};

export default function PlaylistsClient({ playlists }: PlaylistsClientProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold mb-8">Playlists Radio Béguin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-gray-100 rounded-lg overflow-hidden shadow hover:shadow-lg transition">
            <Link href={`/shows/playlists/${playlist.id}`}>
              <Image
                src={playlist.artwork_url || '/images/default-playlist.jpg'}
                alt={playlist.title}
                width={400}
                height={400}
                className="object-cover w-full h-full"
              />
            </Link>
            <div className="p-2">
              <h2 className="font-semibold">{playlist.title}</h2>
              <p className="text-xs text-muted-foreground">
                {playlist.tracks?.length ?? 0} pistes
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
