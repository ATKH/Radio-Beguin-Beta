import { NextRequest, NextResponse } from "next/server";
import { fetchPodcastEpisodes } from "@/lib/podcasts";
import { getAccessToken, invalidateAccessToken } from "@/lib/soundcloud/auth";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  const params = "then" in context.params ? await context.params : context.params;
  const { id } = params;
  const requestUrl = new URL(req.url);

  try {
    const episodes = await fetchPodcastEpisodes();
    const episode = episodes.find(ep => ep.id === id && ep.sharing === "public");
    if (!episode) {
      return NextResponse.json({ error: "Episode not found or private" }, { status: 404 });
    }

    // … (garde ton code fetch SoundCloud existant)

    return NextResponse.redirect(episode.audioUrl); // fallback simple
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
