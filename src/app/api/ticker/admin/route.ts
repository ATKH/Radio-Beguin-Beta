import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/tickerAdmin';
import { listAll, moderate } from '@/lib/tickerStore';

export const dynamic = 'force-dynamic';

// Petite attente avant de refuser, pour ralentir les essais de mots de passe
async function deny() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return deny();
  try {
    return NextResponse.json(await listAll());
  } catch (error) {
    console.error('Ticker: stockage indisponible', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return deny();

  let body: { id?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const { id, action } = body;
  if (typeof id !== 'string' || (action !== 'approve' && action !== 'reject' && action !== 'delete')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  try {
    const found = await moderate(id, action);
    return found
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: 'not_found' }, { status: 404 });
  } catch (error) {
    console.error('Ticker: stockage indisponible', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 500 });
  }
}