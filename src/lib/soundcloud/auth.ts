import { readRefreshToken, readRefreshTokenCandidates, writeRefreshToken } from "./tokenStore";

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = readRefreshToken();
let pendingRequest: Promise<string> | null = null;
let staticAccessToken = process.env.SOUNDCLOUD_ACCESS_TOKEN?.trim() || null;

type ClientCredentialsCache = {
  token: string;
  expiresAt: number;
};

let clientCredentialsCache: ClientCredentialsCache | null = null;
let clientCredentialsCooldownUntil = 0;

async function requestAccessToken(refreshToken: string) {
  const res = await fetch("https://secure.soundcloud.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SOUNDCLOUD_CLIENT_ID!,
      client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  let data: {
    access_token?: string;
    refresh_token?: string;
    [key: string]: unknown;
  } = {};

  try {
    data = await res.json();
  } catch (error) {
    console.error("❌ Réponse invalide du refresh token SoundCloud:", error);
  }

  if (!res.ok || !data.access_token) {
    console.error("❌ Erreur rafraîchissement token SoundCloud:", data);
    return null;
  }

  return data;
}

async function requestClientCredentialsToken() {
  const now = Date.now();
  if (now < clientCredentialsCooldownUntil) {
    const waitMs = clientCredentialsCooldownUntil - now;
    const seconds = Math.ceil(waitMs / 1000);
    const minutes = Math.ceil(seconds / 60);
    const resumeAt = new Date(clientCredentialsCooldownUntil).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.warn(
      `⚠️ SoundCloud client_credentials en pause (${seconds}s / ~${minutes} min restants). Nouvel essai possible vers ${resumeAt}.`
    );
    return null;
  }

  const res = await fetch("https://secure.soundcloud.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SOUNDCLOUD_CLIENT_ID!,
      client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  let data: {
    access_token?: string;
    expires_in?: number;
    [key: string]: unknown;
  } = {};

  try {
    data = await res.json();
  } catch (error) {
    console.error("❌ Réponse invalide client_credentials SoundCloud:", error);
  }

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const coolDownMs = !Number.isNaN(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 60_000;
    const retryHeader = res.headers.get("retry-after") ?? "non fourni";
    console.warn(`⚠️ SoundCloud retry-after (client_credentials): ${retryHeader}`);
    clientCredentialsCooldownUntil = Date.now() + coolDownMs;
    const seconds = Math.ceil(coolDownMs / 1000);
    const minutes = Math.ceil(seconds / 60);
    const resumeAt = new Date(clientCredentialsCooldownUntil).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    console.warn(`⚠️ Rate limit SoundCloud (client_credentials). Nouvel essai dans ${seconds}s (~${minutes} min), vers ${resumeAt}.`);
    return null;
  }

  if (!res.ok || !data.access_token) {
    console.error("❌ Erreur client_credentials SoundCloud:", data);
    return null;
  }

  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;

  clientCredentialsCache = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  clientCredentialsCooldownUntil = 0;

  return data.access_token;
}

/**
 * Récupère un access token valide pour SoundCloud.
 * - Utilise un token en cache si disponible
 * - Sinon rafraîchit le token avec le refresh_token non-expiring
 */
export async function getAccessToken(): Promise<string> {
  if (staticAccessToken) {
    cachedAccessToken = staticAccessToken;
    return staticAccessToken;
  }

  if (cachedAccessToken) return cachedAccessToken;

  if (clientCredentialsCache && clientCredentialsCache.expiresAt > Date.now()) {
    cachedAccessToken = clientCredentialsCache.token;
    return clientCredentialsCache.token;
  }

  if (pendingRequest) return pendingRequest;

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SOUNDCLOUD_CLIENT_ID ou SOUNDCLOUD_CLIENT_SECRET est manquant dans l'environnement.");
  }

  const candidates = readRefreshTokenCandidates();
  const tried = new Set<string>();

  if (cachedRefreshToken) candidates.unshift(cachedRefreshToken);

  pendingRequest = (async () => {
    for (const candidate of candidates) {
      const refreshToken = candidate?.trim();
      if (!refreshToken || tried.has(refreshToken)) continue;
      tried.add(refreshToken);

      const data = await requestAccessToken(refreshToken);
      if (!data?.access_token) {
        continue;
      }

      cachedAccessToken = data.access_token;
      cachedRefreshToken = data.refresh_token || refreshToken;

      if (data.refresh_token) {
        writeRefreshToken(data.refresh_token);
      }

      pendingRequest = null;
      return cachedAccessToken;
    }

    const fallbackToken = await requestClientCredentialsToken();
    if (fallbackToken) {
      cachedAccessToken = fallbackToken;
      pendingRequest = null;
      return fallbackToken;
    }

    cachedAccessToken = null;
    pendingRequest = null;
    throw new Error(
      "Impossible de récupérer un token SoundCloud (refresh et client_credentials échouent). Vérifiez les identifiants API."
    );
  })();

  return pendingRequest;
}

export function invalidateAccessToken() {
  cachedAccessToken = null;
  cachedRefreshToken = readRefreshToken();
  pendingRequest = null;
  clientCredentialsCache = null;
  staticAccessToken = null;
}
