// src/app/api/sc-play/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET?.trim();
const REFRESH_TOKEN = process.env.SOUNDCLOUD_REFRESH_TOKEN?.trim();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing track id" }, { status: 400 });
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error("❌ Variables SoundCloud manquantes (client_id/secret/refresh).");
    return NextResponse.json({ error: "Missing SoundCloud credentials" }, { status: 500 });
  }

  try {
    const accessToken = await fetchAccessTokenFromRefresh();
    if (!accessToken) {
      return NextResponse.json({ error: "Unable to refresh SoundCloud token" }, { status: 502 });
    }

    const trackResp = await fetchTrack(id, accessToken);

    const trackJson = await trackResp.json().catch(() => ({}));

    if (!trackResp.ok) {
      console.error("⚠️ /tracks error:", trackResp.status, trackJson);
      return NextResponse.json(trackJson, { status: trackResp.status });
    }

    const streamUrl = trackJson?.stream_url as string | undefined;
    if (!streamUrl) {
      console.error("❌ Pas de stream_url pour la track", id);
      return NextResponse.json(
        { error: "SoundCloud stream_url missing" },
        { status: 502 }
      );
    }

    const streamResp = await fetchStream(streamUrl, accessToken);

    if (!streamResp.ok || !streamResp.body) {
      const body = await streamResp.text().catch(() => "");
      console.error("⚠️ stream error:", streamResp.status, body);
      return NextResponse.json(
        { error: "Could not fetch stream from SoundCloud" },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      streamResp.headers.get("content-type") || "audio/mpeg"
    );
    headers.set("Cache-Control", "no-store");
    const contentRange = streamResp.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);
    const acceptRanges = streamResp.headers.get("accept-ranges");
    if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

    return new Response(streamResp.body, {
      status: streamResp.status,
      headers,
    });
  } catch (error) {
    console.error("💥 Exception sc-play:", error);
    return NextResponse.json(
      { error: "Internal SoundCloud proxy error" },
      { status: 500 }
    );
  }
}

async function fetchTrack(id: string, token: string, attempt = 0) {
  const headers: Record<string, string> = {
    Authorization: `OAuth ${token}`,
    Accept: "application/json; charset=utf-8",
  };
  const resp = await fetch(`https://api.soundcloud.com/tracks/${id}`, {
    headers,
    cache: "no-store",
  });

  if ((resp.status === 401 || resp.status === 403) && attempt < 2) {
    const refreshed = await fetchAccessTokenFromRefresh();
    if (!refreshed) return resp;
    return fetchTrack(id, refreshed, attempt + 1);
  }

  return resp;
}

async function fetchStream(url: string, token: string, attempt = 0) {
  const headers = {
    Authorization: `OAuth ${token}`,
    Accept: "*/*",
  };
  const resp = await fetch(url, { headers, cache: "no-store" });

  if ((resp.status === 401 || resp.status === 403) && attempt < 2) {
    const refreshed = await fetchAccessTokenFromRefresh();
    if (!refreshed) return resp;
    return fetchStream(url, refreshed, attempt + 1);
  }

  return resp;
}

async function fetchAccessTokenFromRefresh() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) return null;
  try {
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
    const data = (await res.json().catch(() => null)) as
      | { access_token?: string }
      | null;
    if (!res.ok || !data?.access_token) {
      console.error("❌ Échec refresh SoundCloud:", data);
      return null;
    }
    return data.access_token;
  } catch (error) {
    console.error("❌ Exception refresh SoundCloud:", error);
    return null;
  }
}
