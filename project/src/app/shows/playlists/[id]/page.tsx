'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

type Track = {
  id: number;
  title: string;
  duration: number;
};

type Playlist = {
  id: number;
  title: string;
  artwork_url: string | null;
  tracks: Track[];
};

export default function PlaylistPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylistTracks() {
      try {
        const USER_ID = process.env.NEXT_PUBLIC_SOUNDCLOUD_USER_ID;
        const CLIENT_ID = process.env.CLIENT_ID; // public client_id
        const res = await fetch(`https://api-v2.soundcloud.com/playlists/${id}?client_id=${CLIENT_ID}`);
        
        if (!res.ok) {
          const text = await res.text();
          console.error('Erreur API:', text);
          setPlaylist(null);
          return;
        }

        const data = await res.json();

        // On ne garde que les pistes publiques
        const publicTracks = data.tracks?.filter((t: any) => t.sharing === 'public') || [];

        setPlaylist({
          id: data.id,
          title: data.title,
          artwork_url: data.artwork_url?.replace('-large', '-t500x500') || null,
          tracks: publicTracks,
        });
      } catch (err) {
        console.error('Erreur fetchPlaylistTracks:', err);
        setPlaylist(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylistTracks();
  }, [id]);

  if (loading) return <p>Chargement...</p>;
  if (!playlist) return <p>Playlist introuvable.</p>;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{playlist.title}</h1>
      {playlist.artwork_url && (
        <Image
          src={playlist.artwork_url}
          width={500}
          height={500}
          alt={playlist.title}
          className="mb-6 rounded-lg"
        />
      )}
      <ul className="space-y-2">
        {playlist.tracks.map((track) => (
          <li key={track.id} className="p-2 bg-gray-100 rounded">
            {track.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
