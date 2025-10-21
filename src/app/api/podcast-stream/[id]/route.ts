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
    const usedCachedUrl = Boolean(targetUrl);
    if (!targetUrl) {
      const freshUrl = await tryFreshUrl();
      targetUrl = freshUrl ?? episode.audioUrl;
      if (freshUrl) setCachedStreamUrl(id, freshUrl);
    }

    if (wantsJson) {
      return NextResponse.json({ url: targetUrl });
    }

    try {
      const range = req.headers.get("range");
      const upstream = await fetch(targetUrl, {
        cache: "no-store",
        headers: range ? { Range: range } : undefined,
      });

      const passthroughHeaders = [
        "accept-ranges",
        "content-length",
        "content-range",
        "content-type",
        "content-encoding",
        "content-disposition",
        "transfer-encoding",
      ];

      if (!upstream.ok || !upstream.body) {
        invalidateStreamUrl(id);
        console.warn(`⚠️ Lecture directe impossible (${upstream.status}) pour ${targetUrl}`);

        if (usedCachedUrl) {
          const refreshedUrl = await tryFreshUrl();
          if (refreshedUrl) {
            setCachedStreamUrl(id, refreshedUrl);
            targetUrl = refreshedUrl;
            const retryHeaders = range ? { Range: range } : undefined;
            const retryUpstream = await fetch(targetUrl, {
              cache: "no-store",
              headers: retryHeaders,
            });

            if (retryUpstream.ok && retryUpstream.body) {
              const retryResponseHeaders = new Headers();
              passthroughHeaders.forEach((key) => {
                const value = retryUpstream.headers.get(key);
                if (value) retryResponseHeaders.set(key, value);
              });
              if (!retryResponseHeaders.has("accept-ranges")) retryResponseHeaders.set("accept-ranges", "bytes");
              retryResponseHeaders.set("cache-control", "no-store");

              return new NextResponse(retryUpstream.body, {
                status: retryUpstream.status,
                headers: retryResponseHeaders,
              });
            }
          }
        }

        return NextResponse.redirect(targetUrl);
      }

      const headers = new Headers();
      passthroughHeaders.forEach((key) => {
        const value = upstream.headers.get(key);
        if (value) headers.set(key, value);
      });
      if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
      headers.set("cache-control", "no-store");

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers,
      });
    } catch (error) {
      invalidateStreamUrl(id);
      console.warn(`⚠️ Impossible de proxifier ${targetUrl}:`, error);
      return NextResponse.redirect(targetUrl);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
