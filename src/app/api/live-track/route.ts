import { NextResponse } from "next/server";

const CACHE_TTL_MS = 15_000; // 15 secondes

let cachedTrack: { expiresAt: number; payload: { title: string; artist: string } } | null = null;

export async function GET() {
  const now = Date.now();
  
  if (cachedTrack && cachedTrack.expiresAt > now) {
    return NextResponse.json(cachedTrack.payload, {
      headers: {
        "cache-control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  }

  try {
    const TRACK_INFO_URL = "https://stream.radiobeguin.com/api/nowplaying/1";
    const upstream = await fetch(TRACK_INFO_URL, {
      headers: {
        "cache-control": "no-cache",
      },
      next: { revalidate: 0 },
    });

    if (!upstream.ok) {
      if (cachedTrack) {
        return NextResponse.json(cachedTrack.payload, {
          headers: {
            "cache-control": "public, s-maxage=10, stale-while-revalidate=30",
          },
        });
      }
      return NextResponse.json({ error: "upstream_error" }, { status: upstream.status });
    }

    const data = await upstream.json();
    const track = {
      title: data?.now_playing?.song?.title ?? "",
      artist: data?.now_playing?.song?.artist ?? "",
    };

    cachedTrack = {
      payload: track,
      expiresAt: now + CACHE_TTL_MS,
    };

    return NextResponse.json(track, {
      headers: {
        "cache-control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[live-track]", error);
    if (cachedTrack) {
      return NextResponse.json(cachedTrack.payload, {
        headers: {
          "cache-control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      });
    }
    return NextResponse.json({ title: "", artist: "" }, { status: 500 });
  }
}