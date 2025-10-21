const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

let cachedAccessToken = null;

function getStaticAccessToken() {
  const raw = process.env.SOUNDCLOUD_ACCESS_TOKEN?.trim();
  if (!raw) return null;
  console.log("✅ SoundCloud access_token fourni via SOUNDCLOUD_ACCESS_TOKEN");
  return raw;
}

async function tryRefreshToken() {
  const refreshToken = process.env.SOUNDCLOUD_REFRESH_TOKEN;
  if (!refreshToken) return null;

  try {
    const res = await fetch("https://api.soundcloud.com/oauth2/token", {
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

async function getAccessToken() {
  if (cachedAccessToken) return cachedAccessToken;

  const staticToken = getStaticAccessToken();
  if (staticToken) {
    cachedAccessToken = staticToken;
    return staticToken;
  }

  let token = await tryRefreshToken();

  if (!token) {
    throw new Error("Impossible d'obtenir un access_token SoundCloud. Lance `npm run soundcloud:authorize`.");
  }

  cachedAccessToken = token;
  return token;
}

module.exports = { getAccessToken };
