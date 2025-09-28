// src/app/api/playlists/[id]/route.ts
import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/soundcloud/auth';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const { id } = params;

  try {
    const token = await getAccessToken();
    const res = await fetch(`https://api.soundcloud.com/playlists/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Erreur SoundCloud API:', text);
      return NextResponse.json(null, { status: res.status });
    }

    const playlist = await res.json();
    return NextResponse.json(playlist, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(null, { status: 500 });
  }
}
