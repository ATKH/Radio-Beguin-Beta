import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { addMessage } from '@/lib/tickerStore';

export const dynamic = 'force-dynamic';

const MIN_LEN = 2;
const MAX_LEN = 60;
// Lettres (accents compris), chiffres, espaces et ponctuation courante
const ALLOWED = /^[\p{L}\p{N} .,!?'’\-:;()&@#/+*"«»…♥]+$/u;

export async function POST(request: Request) {
  let body: { text?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  // Champ piège invisible : un humain ne le remplit jamais, un robot si.
  // On répond « ok » sans rien enregistrer.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
  if (text.length < MIN_LEN || text.length > MAX_LEN || !ALLOWED.test(text)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  // Empreinte de l'IP (pas l'IP elle-même) pour limiter le nombre d'envois par personne
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const salt = process.env.TICKER_SALT ?? 'ticker';
  const ipHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16);

  try {
    const result = await addMessage(text, ipHash);
    if (!result.ok) {
      const status = result.error === 'rate_limited' ? 429 : 503;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Ticker: stockage indisponible', error);
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 500 });
  }
}