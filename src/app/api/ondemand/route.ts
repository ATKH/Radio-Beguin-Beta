import { NextResponse } from 'next/server';

const AZURACAST_BASE = 'https://studio.ondezero.net';
const STATION = 'radio_beguin';

type AzuraItem = {
  track_id: string;
  download_url: string;
  media?: {
    art?: string;
    artist?: string;
    title?: string;
    text?: string;
    genre?: string;
  };
};

export async function GET() {
  try {
    const res = await fetch(`${AZURACAST_BASE}/api/station/${STATION}/ondemand`, {
      next: { revalidate: 300 }, // rafraîchi toutes les 5 minutes
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
    }

    const items: AzuraItem[] = await res.json();

    const tracks = items.map((item) => ({
      id: item.track_id,
      title: item.media?.title || item.media?.text || 'Sans titre',
      artist: item.media?.artist || '',
      genre: (item.media?.genre || '').trim(), // = nom de la playlist
      // download_url est relatif : on le rend absolu
      audioUrl: new URL(item.download_url, AZURACAST_BASE).toString(),
      artworkUrl: item.media?.art || '',
    }));

    return NextResponse.json(tracks);
  } catch {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }
}