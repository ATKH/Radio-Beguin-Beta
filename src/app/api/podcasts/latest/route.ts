import { NextResponse } from "next/server";
import { fetchLatestEpisodes } from "@/lib/podcasts";

export async function GET() {
  try {
    const episodes = await fetchLatestEpisodes(12);
    return NextResponse.json(episodes);
  } catch (error) {
    console.error("Erreur API /api/podcasts/latest:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
