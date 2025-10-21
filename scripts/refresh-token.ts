// scripts/refresh-token.ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import fetch from 'node-fetch';

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SOUNDCLOUD_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  throw new Error("❌ SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET ou SOUNDCLOUD_REFRESH_TOKEN manquant dans .env.local");
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

async function refreshSoundCloudToken(): Promise<TokenResponse> {
  const res = await fetch('https://api.soundcloud.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN!,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`❌ Erreur lors du refresh token SoundCloud: ${res.status} - ${errText}`);
  }

  const data = (await res.json()) as TokenResponse;
  return data;
}

// Fonction principale auto-exécutante
(async () => {
  try {
    const tokenData = await refreshSoundCloudToken();
    console.log('✅ Nouveau token généré :', tokenData.access_token);
    console.log('Refresh token :', tokenData.refresh_token);
    console.log('Expire dans (s) :', tokenData.expires_in);
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
})();
