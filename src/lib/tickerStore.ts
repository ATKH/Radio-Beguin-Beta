import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type TickerStatus = 'pending' | 'approved' | 'rejected';

export type TickerMessage = {
  id: string;
  text: string;
  status: TickerStatus;
  createdAt: number;
  moderatedAt?: number;
  ipHash: string; // empreinte de l'IP (jamais l'IP elle-même), pour limiter les envois
};

export type PublicTickerMessage = Omit<TickerMessage, 'ipHash'>;

// --- Réglages -------------------------------------------------------------
const KEY = 'ticker:messages';
const MAX_PENDING = 200; // messages en attente au maximum
const MAX_PER_IP_PER_HOUR = 3; // envois par personne et par heure
const REJECTED_KEEP_MS = 14 * 24 * 3600 * 1000; // les refusés sont oubliés après 14 jours

// --- Où stocker ? ---------------------------------------------------------
// En production : base Redis (Upstash, ou Vercel KV) via ces deux variables d'environnement.
// En local, sans ces variables : simple fichier `.data/ticker-messages.json`.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const FILE = path.join(process.cwd(), '.data', 'ticker-messages.json');

async function redis(command: string[]) {
  const res = await fetch(REDIS_URL as string, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(String(data.error));
  return data.result;
}

async function readAll(): Promise<TickerMessage[]> {
  if (REDIS_URL && REDIS_TOKEN) {
    const raw = await redis(['GET', KEY]);
    return raw ? (JSON.parse(raw) as TickerMessage[]) : [];
  }
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as TickerMessage[];
  } catch {
    return [];
  }
}

async function writeAll(list: TickerMessage[]) {
  if (REDIS_URL && REDIS_TOKEN) {
    await redis(['SET', KEY, JSON.stringify(list)]);
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), 'utf8');
}

const strip = ({ ipHash: _ipHash, ...rest }: TickerMessage): PublicTickerMessage => rest;

// --- Envoi d'un message (public) ------------------------------------------
export async function addMessage(
  text: string,
  ipHash: string
): Promise<{ ok: true } | { ok: false; error: 'rate_limited' | 'full' }> {
  const now = Date.now();
  const list = (await readAll()).filter(
    (m) => m.status !== 'rejected' || now - (m.moderatedAt ?? m.createdAt) < REJECTED_KEEP_MS
  );

  const recent = list.filter((m) => m.ipHash === ipHash && now - m.createdAt < 3600_000).length;
  if (recent >= MAX_PER_IP_PER_HOUR) return { ok: false, error: 'rate_limited' };

  if (list.filter((m) => m.status === 'pending').length >= MAX_PENDING) {
    return { ok: false, error: 'full' };
  }

  // Doublon d'un message déjà en attente ou validé : on fait comme si c'était pris en compte
  const lower = text.toLowerCase();
  if (list.some((m) => m.status !== 'rejected' && m.text.toLowerCase() === lower)) {
    return { ok: true };
  }

  list.push({ id: randomUUID(), text, status: 'pending', createdAt: now, ipHash });
  await writeAll(list);
  return { ok: true };
}

// --- Messages validés, pour la barre (public) -----------------------------
export async function listApproved(limit: number): Promise<string[]> {
  const list = await readAll();
  return list
    .filter((m) => m.status === 'approved')
    .sort((a, b) => (a.moderatedAt ?? a.createdAt) - (b.moderatedAt ?? b.createdAt))
    .slice(-limit)
    .map((m) => m.text);
}

// --- Modération (admin) ---------------------------------------------------
export async function listAll(): Promise<PublicTickerMessage[]> {
  return (await readAll()).map(strip);
}

export async function moderate(
  id: string,
  action: 'approve' | 'reject' | 'delete'
): Promise<boolean> {
  const list = await readAll();
  const index = list.findIndex((m) => m.id === id);
  if (index === -1) return false;

  if (action === 'delete') {
    list.splice(index, 1);
  } else {
    list[index].status = action === 'approve' ? 'approved' : 'rejected';
    list[index].moderatedAt = Date.now();
  }
  await writeAll(list);
  return true;
}