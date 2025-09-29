// src/app/api/podcast-stream/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchPodcastEpisodes } from "@/lib/podcasts";
import { getAccessToken, invalidateAccessToken } from "@/lib/soundcloud/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const requestUrl = new URL(req.url);
  const wantsJson = requestUrl.searchParams.get("format") === "json";

  try {
    const episodes = await fetchPodcastEpisodes();
    const episode = episodes.find(
      (ep) => ep.id === id && ep.sharing === "public"
    );

    if (!episode || !episode.audioUrl) {
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

    const targetUrl = (await tryFreshUrl()) ?? episode.audioUrl;

    if (wantsJson) {
      return NextResponse.json({ url: targetUrl });
    }

    try {
      const upstream = await fetch(targetUrl, { cache: "no-store" });
      if (!upstream.ok || !upstream.body) {
        console.warn(`⚠️ Lecture directe impossible (${upstream.status}) pour ${targetUrl}`);
        return NextResponse.redirect(targetUrl);
      }

      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.warn(`⚠️ Impossible de proxifier ${targetUrl}:`, error);
      return NextResponse.redirect(targetUrl);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
