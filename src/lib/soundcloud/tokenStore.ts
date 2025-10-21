function getEnvRefreshToken(): string | null {
  const raw = process.env.SOUNDCLOUD_REFRESH_TOKEN;
  return raw && raw.trim().length > 0 ? raw.trim() : null;
}

export function readRefreshToken(): string | null {
  const candidates = readRefreshTokenCandidates();
  return candidates.length > 0 ? candidates[0] : null;
}

export function writeRefreshToken(): boolean {
  // plus de persistence locale : on s'appuie uniquement sur l'environnement
  return true;
}

export function readRefreshTokenCandidates(): string[] {
  const candidates = new Set<string>();

  const fromEnv = getEnvRefreshToken();
  if (fromEnv) candidates.add(fromEnv);

  return Array.from(candidates);
}
