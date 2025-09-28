const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
let REFRESH_TOKEN = process.env.SOUNDCLOUD_REFRESH_TOKEN!;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  throw new Error("❌ CLIENT_ID, CLIENT_SECRET ou SOUNDCLOUD_REFRESH_TOKEN manquant dans .env");
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

async function fetchAccessToken(): Promise<TokenResponse> {
  const res = await fetch("https://api.soundcloud.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`❌ Erreur token SoundCloud: ${res.status} - ${errText}`);
  }

  return res.json();
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const tokenData = await fetchAccessToken();
  cachedToken = tokenData.access_token;
  REFRESH_TOKEN = tokenData.refresh_token || REFRESH_TOKEN;
  tokenExpiry = now + tokenData.expires_in * 1000;

  return cachedToken;
}
