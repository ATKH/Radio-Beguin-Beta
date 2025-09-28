import { NextResponse } from 'next/server';
import { fetchPodcastEpisodes } from '@/lib/podcasts';

export async function GET() {
  try {
    const episodes = await fetchPodcastEpisodes();

    return NextResponse.json(episodes, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (err) {
    console.error('Erreur serveur API podcasts:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
