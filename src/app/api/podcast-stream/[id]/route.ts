// src/app/api/podcast-stream/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchPodcastEpisodes } from "@/lib/podcasts";
import type { PodcastEpisode } from "@/lib/podcasts";
import { getAccessToken, invalidateAccessToken } from "@/lib/soundcloud/auth";

const EPISODE_CACHE_TTL = 1000 * 60 * 5;

type EpisodeCacheEntry = {
  expiresAt: number;
  map: Map<string, PodcastEpisode>;
};

const episodeCache: EpisodeCacheEntry = {
  expiresAt: 0,
  map: new Map(),
};

async function getEpisode(id: string) {
  const now = Date.now();
  if (episodeCache.expiresAt < now) {
    const episodes = await fetchPodcastEpisodes();
    episodeCache.map = new Map(episodes.map((ep) => [ep.id, ep]));
    episodeCache.expiresAt = now + EPISODE_CACHE_TTL;
  }
  return episodeCache.map.get(id);
}

async function fetchTrackInfo(trackId: string, attempt = 0) {
  const url = new URL(`https://api.soundcloud.com/tracks/${trackId}`);
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  if (clientId && !url.searchParams.has("client_id")) {
    url.searchParams.set("client_id", clientId);
  }

  const headers: Record<string, string> = {};
  try {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `OAuth ${token}`;
    }
  } catch (error) {
    console.warn("⚠️ fetchTrackInfo: impossible de récupérer un token:", error);
  }

  console.log("[fetchTrackInfo] Authorization header present:", Boolean(headers.Authorization));
  const res = await fetch(url, { headers, cache: "no-store" });

  if ((res.status === 401 || res.status === 403) && attempt < 1) {
    invalidateAccessToken();
    return fetchTrackInfo(trackId, attempt + 1);
  }

  if (!res.ok) {
    console.warn("⚠️ fetchTrackInfo échoue:", trackId, res.status, await res.text());
    return null;
  }

  return res.json() as Promise<{ stream_url?: string | null; sharing?: string }>;
}

async function streamTrack(
  req: NextRequest,
  streamUrl: string,
  attempt = 0
): Promise<Response | NextResponse> {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const url = new URL(streamUrl);
  if (clientId && !url.searchParams.has("client_id")) {
    url.searchParams.set("client_id", clientId);
  }

  const headers: Record<string, string> = {};
  const range = req.headers.get("range");
  if (range) headers.Range = range;

  try {
    const token = await getAccessToken();
    if (token) headers.Authorization = `OAuth ${token}`;
  } catch (error) {
    console.warn("⚠️ streamTrack: impossible de récupérer un token:", error);
  }

  console.log("[streamTrack] Authorization header present:", Boolean(headers.Authorization));
  const upstream = await fetch(url, { headers, cache: "no-store" });

  if ((upstream.status === 401 || upstream.status === 403) && attempt < 1) {
    invalidateAccessToken();
    return streamTrack(req, streamUrl, attempt + 1);
  }

  if (!upstream.body) {
    return NextResponse.json({ error: "Flux introuvable" }, { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    const body = await upstream.text().catch(() => "");
    return NextResponse.json({ error: body || "SoundCloud stream error" }, { status: upstream.status });
  }

  const responseHeaders = new Headers();
  ["content-type", "content-length", "content-range", "accept-ranges"].forEach((key) => {
    const value = upstream.headers.get(key);
    if (value) responseHeaders.set(key, value);
  });
  responseHeaders.set("cache-control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestUrl = new URL(req.url);
  const wantsJson = requestUrl.searchParams.get("format") === "json";

  try {
    const episode = await getEpisode(id);
    if (!episode || episode.sharing === "private") {
      return NextResponse.json({ error: "Episode not found or private" }, { status: 404 });
    }

    const trackInfo = await fetchTrackInfo(id);
    if (!trackInfo?.stream_url) {
      return NextResponse.json({ error: "SoundCloud stream_url missing" }, { status: 502 });
    }

    if (wantsJson) {
      return NextResponse.json({
        url: `/api/sc-play/${id}?ts=${Date.now()}`,
        protocol: "progressive",
      });
    }

    return streamTrack(req, trackInfo.stream_url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
