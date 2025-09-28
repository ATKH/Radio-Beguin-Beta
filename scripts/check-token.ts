// scripts/check-token.ts
import "dotenv/config";
import fetch from "node-fetch";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

async function main() {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
  const refreshToken = process.env.SOUNDCLOUD_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("❌ Il manque SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET ou SOUNDCLOUD_REFRESH_TOKEN dans .env");
    process.exit(1);
  }

  console.log("🔑 Refresh token actuel:", refreshToken);

  try {
    const res = await fetch("https://secure.soundcloud.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = (await res.json()) as TokenResponse;

    if (!res.ok) {
      console.error("❌ Erreur lors du refresh:", data);
      process.exit(1);
    }

    console.log("✅ Nouveau token reçu !");
    console.log("access_token:", data.access_token);
    console.log("refresh_token:", data.refresh_token);
    console.log("expire dans:", data.expires_in, "secondes");
  } catch (err) {
    console.error("❌ Erreur fatale:", err);
    process.exit(1);
  }
}

main();
