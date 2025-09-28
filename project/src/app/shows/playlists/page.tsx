'use client';

import React, { useEffect, useState } from 'react';
import PlaylistsClient from '@/components/PlaylistsClient';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const res = await fetch('/api/playlists');
        if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
        const data = await res.json();
        setPlaylists(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPlaylists();
  }, []);

  if (loading) return <p>Chargement des playlists...</p>;
  if (error) return <p>Erreur : {error}</p>;
  if (playlists.length === 0) return <p>Aucune playlist disponible.</p>;

  return <PlaylistsClient playlists={playlists} />;
}
