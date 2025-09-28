// src/app/api/playlists/route.ts
import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/soundcloud/auth';

export async function GET() {
  try {
    const token = await getAccessToken();
    const res = await fetch(`https://api.soundcloud.com/users/815775241/playlists`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Erreur SoundCloud API:', text);
      return NextResponse.json([], { status: res.status });
    }

    const playlists = await res.json();
    return NextResponse.json(playlists, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
