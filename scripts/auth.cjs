// Polyfill fetch en CJS (Node 18+ n’a pas fetch en require)
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

let cachedAccessToken = null;

/**
 * Essaie de récupérer un access_token via refresh_token
 */
async function tryRefreshToken() {
  const refreshToken = process.env.SOUNDCLOUD_REFRESH_TOKEN;
  if (!refreshToken) return null;

  try {
    const res = await fetch("https://secure.soundcloud.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SOUNDCLOUD_CLIENT_ID,
        client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.warn("⚠️ Refresh token invalide:", data);
      return null;
    }

    console.log("✅ SoundCloud access_token obtenu via refresh_token");
    return data.access_token;
  } catch (err) {
    console.warn("⚠️ Erreur lors du refresh_token:", err);
    return null;
  }
}

/**
 * Fallback avec client_credentials
 */
async function tryClientCredentials() {
  try {
    const res = await fetch("https://secure.soundcloud.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SOUNDCLOUD_CLIENT_ID,
        client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error("❌ Erreur client_credentials:", data);
      return null;
    }

    console.log("✅ SoundCloud access_token obtenu via client_credentials");
    return data.access_token;
  } catch (err) {
    console.error("❌ Erreur client_credentials:", err);
    return null;
  }
}

/**
 * Fonction principale
 */
async function getAccessToken() {
  if (cachedAccessToken) return cachedAccessToken;

  // 1. Essayer avec refresh_token
  let token = await tryRefreshToken();

  // 2. Fallback client_credentials
  if (!token) {
    token = await tryClientCredentials();
  }

  if (!token) {
    throw new Error("Impossible d'obtenir un access_token SoundCloud");
  }

  cachedAccessToken = token;
  return token;
}

module.exports = { getAccessToken };
