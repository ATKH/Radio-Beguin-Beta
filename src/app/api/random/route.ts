import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { PodcastEpisode } from "@/lib/podcasts";

const PODCASTS_PATH = path.join(process.cwd(), "src/data/podcasts.json");

// Shuffle classique (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function GET() {
  try {
    const raw = await readFile(PODCASTS_PATH, "utf8");
    const payload = JSON.parse(raw);
    const list: PodcastEpisode[] = Array.isArray(payload?.episodes) ? payload.episodes : [];

    if (list.length === 0) {
      return NextResponse.json({ episodes: [] });
    }

    // ✅ limiter aux 200 derniers épisodes
    const LIMIT = 200;
    const recent = list.slice(-LIMIT);

    const shuffled = shuffle(recent);
    return NextResponse.json({ episodes: shuffled.slice(0, 8) });
  } catch (error) {
    console.error("Erreur API /api/random:", error);
    return NextResponse.json({ episodes: [] }, { status: 500 });
  }
}
