import { NextResponse } from "next/server";

const TRACK_INFO_URL = "https://api.radioking.io/widget/radio/radio-beguin-1/track/current";

export async function GET() {
  try {
    const upstream = await fetch(TRACK_INFO_URL, {
      headers: {
        "cache-control": "no-cache",
      },
      next: { revalidate: 0 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: upstream.status });
    }

    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[live-track]", error);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
