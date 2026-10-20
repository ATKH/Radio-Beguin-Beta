import { unlinkSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";

/**
 * Authentification SoundCloud en mode "application" (client_credentials).
 *
 * - Aucun navigateur, aucun refresh token, aucun SOUNDCLOUD_ACCESS_TOKEN à gérer.
 * - Variables requises : SOUNDCLOUD_CLIENT_ID et SOUNDCLOUD_CLIENT_SECRET.
 * - Le token (~1 h) est mis en cache en mémoire ET sur disque (dossier temporaire),
 *   pour ne pas en redemander un à chaque run : SoundCloud limite ces demandes.
 * - Les variables d'environnement sont lues à l'appel, jamais à l'import.
 */

const TOKEN_ENDPOINT = "https://secure.soundcloud.com/oauth/token";
const CACHE_FILE = path.join(os.tmpdir(), "radio-beguin-soundcloud-token.json");
const EXPIRY_MARGIN_MS = 60_000;

type CachedToken = { token: string; expiresAt: number };

let memoryCache: CachedToken | null = null;
let pendingRequest: Promise<string> | null = null;
let cooldownUntil = 0;

function isValid(entry: CachedToken | null): entry is CachedToken {
  return !!entry && !!entry.token && entry.expiresAt - EXPIRY_MARGIN_MS > Date.now();
}

async function readFileCache(): Promise<CachedToken | null> {
  try {
    const raw = JSON.parse(await readFile(CACHE_FILE, "utf8"));
    if (typeof raw?.token === "string" && typeof raw?.expiresAt === "number") {
      return { token: raw.token, expiresAt: raw.expiresAt };
    }
  } catch {
    // pas de cache ou fichier illisible : on redemandera un token
  }
  return null;
}

async function writeFileCache(entry: CachedToken) {
  try {
    await writeFile(CACHE_FILE, JSON.stringify(entry), { encoding: "utf8", mode: 0o600 });
  } catch (error) {
    console.warn("⚠️ Impossible d'écrire le cache du token SoundCloud (non bloquant):", error);
  }
}

async function requestToken(): Promise<string> {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID?.trim();
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("SOUNDCLOUD_CLIENT_ID ou SOUNDCLOUD_CLIENT_SECRET est manquant dans l'environnement.");
  }

  const now = Date.now();
  if (now < cooldownUntil) {
    const seconds = Math.ceil((cooldownUntil - now) / 1000);
    throw new Error(`SoundCloud a limité les demandes de token. Nouvel essai possible dans ~${seconds}s.`);
  }

  console.log("[soundcloud] demande d'un nouveau token (client_credentials)…");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 60_000;
    cooldownUntil = Date.now() + waitMs;
    throw new Error(`SoundCloud a limité les demandes de token (429). Réessaie dans ~${Math.ceil(waitMs / 1000)}s.`);
  }

  let data: { access_token?: string; expires_in?: number; [key: string]: unknown } = {};
  try {
    data = await res.json();
  } catch {
    // corps non JSON : géré ci-dessous
  }

  if (!res.ok || !data.access_token) {
    // On n'affiche que le statut et le code d'erreur, jamais de secret.
    throw new Error(
      `Échec client_credentials SoundCloud: HTTP ${res.status} ${String(data.error ?? "")}`.trim()
    );
  }

  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  const entry: CachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  memoryCache = entry;
  await writeFileCache(entry);
  return entry.token;
}

/**
 * Renvoie un token SoundCloud valide : cache mémoire, puis cache disque, puis nouvelle demande.
 */
export async function getAccessToken(): Promise<string> {
  if (isValid(memoryCache)) return memoryCache.token;

  const fromDisk = await readFileCache();
  if (isValid(fromDisk)) {
    memoryCache = fromDisk;
    return fromDisk.token;
  }

  if (!pendingRequest) {
    pendingRequest = requestToken().finally(() => {
      pendingRequest = null;
    });
  }
  return pendingRequest;
}

/**
 * À appeler si l'API répond 401 : force une nouvelle demande au prochain getAccessToken().
 */
export function invalidateAccessToken() {
  memoryCache = null;
  pendingRequest = null;
  try {
    unlinkSync(CACHE_FILE);
  } catch {
    // fichier absent : rien à faire
  }
}