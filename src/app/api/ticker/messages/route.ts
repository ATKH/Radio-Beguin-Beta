import { NextResponse } from 'next/server';
import { listApproved } from '@/lib/tickerStore';

export const dynamic = 'force-dynamic';

const MAX_IN_BAR = 30; // nombre maximum de messages validés qui tournent dans la barre

export async function GET() {
  try {
    const messages = await listApproved(MAX_IN_BAR);
    return NextResponse.json(messages, {
      // Le CDN garde la réponse 1 minute : la base n'est pas interrogée à chaque visite
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    // En cas de souci de stockage, la barre affiche simplement son message habituel
    return NextResponse.json([]);
  }
}