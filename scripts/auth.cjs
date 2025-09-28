// scripts/auth.cjs
require("dotenv").config();

let cachedAccessToken = null;

async function getAccessToken() {
  if (cachedAccessToken) return cachedAccessToken;

  const res = await fetch("https://secure.soundcloud.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SOUNDCLOUD_CLIENT_ID,
      client_secret: process.env.SOUNDCLOUD_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`❌ SoundCloud auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  return cachedAccessToken;
}

function invalidateAccessToken() {
  cachedAccessToken = null;
}

module.exports = {
  getAccessToken,
  invalidateAccessToken,
};
