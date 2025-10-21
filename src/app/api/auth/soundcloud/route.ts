import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;
const ENV_REDIRECT_URI = process.env.SOUNDCLOUD_REDIRECT_URI;
const DEFAULT_SCOPE = process.env.SOUNDCLOUD_SCOPE || "non-expiring";

export async function GET(request: NextRequest) {
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "SOUNDCLOUD_CLIENT_ID manquant" }, { status: 500 });
  }

  const requestOrigin = request.nextUrl.origin;
  const origin = SITE_URL || ENV_REDIRECT_URI?.split("/api/")[0] || requestOrigin || "http://localhost:3000";
  const redirectUri = ENV_REDIRECT_URI || `${origin.replace(/\/$/, "")}/api/auth/callback/soundcloud`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: DEFAULT_SCOPE,
    display: "popup",
  });

  return NextResponse.redirect(`https://soundcloud.com/connect?${params.toString()}`);
}
