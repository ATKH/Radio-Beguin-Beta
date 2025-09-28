import { NextResponse } from "next/server";
import { fetchAggregatedPodcastData } from "@/lib/podcasts";

export async function GET() {
  try {
    const data = await fetchAggregatedPodcastData();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Erreur API /api/podcasts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
