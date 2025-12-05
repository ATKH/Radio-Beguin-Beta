import { NextResponse } from "next/server";

const TRACK_INFO_URL = "https://api.radioking.io/widget/radio/radio-beguin-1/track/current";
const CACHE_TTL_MS = 15_000;

type LiveTrackCache = {
  expiresAt: number;
  payload: unknown;
};

let cachedTrack: LiveTrackCache | null = null;

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
    cachedTrack = {
      payload: data,
      expiresAt: now + CACHE_TTL_MS,
    };
    return NextResponse.json(data, {
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
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
