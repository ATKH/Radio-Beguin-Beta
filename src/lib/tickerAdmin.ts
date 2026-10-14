import { createHash, timingSafeEqual } from 'crypto';

/** Vrai si la requête porte le bon mot de passe admin (en-tête `Authorization: Bearer ...`). */
export function isAdmin(request: Request): boolean {
  const expected = process.env.TICKER_ADMIN_PASSWORD;
  if (!expected) return false; // pas de mot de passe configuré = admin désactivé

  const header = request.headers.get('authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';

  // On compare des empreintes de même longueur, à temps constant
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}