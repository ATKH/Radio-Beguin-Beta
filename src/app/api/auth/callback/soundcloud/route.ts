import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID!;
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SOUNDCLOUD_REDIRECT_URI!; // Ex : http://localhost:3000/api/auth/callback/soundcloud

const tokensFile = path.join(process.cwd(), "src/lib/soundcloud/tokens.json");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code manquant dans l'URL" }, { status: 400 });
    }

    // On échange le code contre un access_token
    const form = new URLSearchParams();
    form.append("client_id", CLIENT_ID);
    form.append("client_secret", CLIENT_SECRET);
    form.append("redirect_uri", REDIRECT_URI);
    form.append("grant_type", "authorization_code");
    form.append("code", code);

    const res = await fetch("https://api.soundcloud.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Erreur SoundCloud token:", text);
      return NextResponse.json({ error: "Impossible de récupérer le token" }, { status: 500 });
    }

    const data = await res.json();

    const hasRefreshToken = typeof data.refresh_token === "string" && data.refresh_token.trim().length > 0;

    try {
      fs.writeFileSync(tokensFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn("⚠️ Impossible d'écrire tokens.json complet (lecture seule ?) :", error);
    }

    const wantsJson = req.headers.get("accept")?.includes("application/json") ||
      searchParams.get("format") === "json";

    if (wantsJson) {
      return NextResponse.json({ success: true, hasRefreshToken, data });
    }

    const html = `<!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Autorisation SoundCloud</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f7fb; color: #1f1f1f; padding: 40px; }
            .card { background: white; border-radius: 16px; padding: 32px; max-width: 640px; margin: 0 auto; box-shadow: 0 24px 60px -24px rgba(0,0,0,0.15); }
            h1 { margin-top: 0; margin-bottom: 16px; }
            pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto; }
            .tokens { margin-top: 24px; display: grid; gap: 16px; }
            .hint { margin-top: 24px; font-size: 0.9rem; line-height: 1.5; color: #475569; }
            .status { margin-bottom: 8px; font-weight: 600; color: #16a34a; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Autorisation réussie</h1>
            <p class="status">Le code d'autorisation a été échangé avec succès.</p>
            <div class="tokens">
              ${data.refresh_token ? `<div><strong>Refresh token</strong><pre>${data.refresh_token}</pre></div>` : ""}
              ${data.access_token ? `<div><strong>Access token (éphémère)</strong><pre>${data.access_token}</pre></div>` : ""}
            </div>
            <div class="hint">
              <p>Copiez le <code>refresh_token</code> et enregistrez-le dans votre configuration (<code>.env.local</code>, variables Vercel, etc.).<br/>Sur Vercel, ajoutez la variable <code>SOUNDCLOUD_REFRESH_TOKEN</code> dans l’onglet <em>Environment Variables</em>.</p>
              <p>Le fichier <code>src/lib/soundcloud/tokens.json</code> n'est plus utilisé : seule la variable d'environnement fait foi.</p>
            </div>
          </div>
        </body>
      </html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
