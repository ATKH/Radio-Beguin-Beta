// src/app/api/podcast-stream/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchPodcastEpisodes } from "@/lib/podcasts";
import { getAccessToken, invalidateAccessToken } from "@/lib/soundcloud/auth";
import type { PodcastEpisode } from "@/lib/podcasts";

const EPISODE_CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const STREAM_URL_CACHE_TTL = 1000 * 60 * 5;

type EpisodeCacheEntry = {
  expiresAt: number;
  map: Map<string, PodcastEpisode>;
};

const episodeCache: EpisodeCacheEntry = {
  expiresAt: 0,
  map: new Map(),
};

const streamUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function getEpisodeById(id: string) {
  const now = Date.now();
  if (episodeCache.expiresAt < now) {
    const episodes = await fetchPodcastEpisodes();
    episodeCache.map = new Map(
      episodes.map((episode) => [episode.id, episode])
    );
    episodeCache.expiresAt = now + EPISODE_CACHE_TTL;
  }

  return episodeCache.map.get(id);
}

function getCachedStreamUrl(id: string) {
  const entry = streamUrlCache.get(id);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    streamUrlCache.delete(id);
    return null;
  }
  return entry.url;
}

function setCachedStreamUrl(id: string, url: string) {
  streamUrlCache.set(id, { url, expiresAt: Date.now() + STREAM_URL_CACHE_TTL });
}

function invalidateStreamUrl(id: string) {
  streamUrlCache.delete(id);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestUrl = new URL(req.url);
  const wantsJson = requestUrl.searchParams.get("format") === "json";

  try {
    const episode = await getEpisodeById(id);

    if (!episode || episode.sharing !== "public" || !episode.audioUrl) {
      return NextResponse.json(
        { error: "Episode not found or private" },
        { status: 404 }
      );
    }

    const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
    const trackAuthorization = episode.trackAuthorization ?? undefined;

    const streamProtocols: string[] = [
      "http_mp3_320_url",
      "http_mp3_192_url",
      "http_mp3_128_url",
      "http_mp3_64_url",
      "http_mp3_32_url",
      "hls_mp3_320_url",
      "hls_mp3_192_url",
      "hls_mp3_128_url",
      "hls_mp3_64_url",
      "hls_mp3_32_url",
    ];

    const pickUrl = (data?: Record<string, string | undefined> | null) => {
      if (!data) return null;
      for (const key of streamProtocols) {
        const candidate = data[key];
        if (candidate) return candidate;
      }
      return null;
    };

    const fetchStreams = async (withAuth: boolean) => {
      const apiUrl = new URL(`https://api.soundcloud.com/i1/tracks/${id}/streams`);
      if (!withAuth && clientId) apiUrl.searchParams.set("client_id", clientId);
      if (trackAuthorization) apiUrl.searchParams.set("track_authorization", trackAuthorization);

      const headers: Record<string, string> = {};
      if (withAuth) {
        const accessToken = await getAccessToken();
        headers.Authorization = `OAuth ${accessToken}`;
      }

      const res = await fetch(apiUrl, { headers, cache: "no-store" });

      if (withAuth && (res.status === 401 || res.status === 403)) {
        invalidateAccessToken();
        return { retry: true, data: null } as const;
      }

      if (!res.ok) return { retry: false, data: null } as const;

      const data = (await res.json()) as Record<string, string | undefined>;
      return { retry: false, data } as const;
    };

    const tryFreshUrl = async () => {
      const firstAttempt = await fetchStreams(false);
      if (firstAttempt.data) return pickUrl(firstAttempt.data);

      for (let i = 0; i < 2; i++) {
        const result = await fetchStreams(true);
        if (result.retry) continue;
        if (result.data) return pickUrl(result.data);
      }

      return null;
    };

    let targetUrl = getCachedStreamUrl(id);
    if (!targetUrl) {
      const freshUrl = await tryFreshUrl();
      targetUrl = freshUrl ?? episode.audioUrl;
      if (freshUrl) setCachedStreamUrl(id, freshUrl);
    }

    if (wantsJson) {
      return NextResponse.json({ url: targetUrl });
    }

    // On redirige le lecteur vers l'URL SoundCloud : Vercel ne stream pas le fichier.
    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
