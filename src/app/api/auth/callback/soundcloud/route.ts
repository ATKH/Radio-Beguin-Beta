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

    // Sauvegarde des tokens localement
    fs.writeFileSync(tokensFile, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
