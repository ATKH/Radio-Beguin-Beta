import { NextRequest, NextResponse } from "next/server";
import { fetchPodcastPlaylists, fetchPodcastEpisodes } from "@/lib/podcasts";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ attendre la Promise
  const requestUrl = new URL(req.url);
  const wantsJson = requestUrl.searchParams.get("format") === "json";

  try {
    const [playlists, episodes] = await Promise.all([
      fetchPodcastPlaylists(),
      fetchPodcastEpisodes(),
    ]);

    const playlist = playlists.find(pl => pl.id === id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // récupérer tous les épisodes de la playlist
    const episodeMap = new Map(episodes.map(ep => [ep.id, ep]));
    const playlistEpisodes = playlist.episodeIds
      .map(epId => episodeMap.get(epId))
      .filter((ep): ep is typeof episodes[number] => Boolean(ep));

    if (playlistEpisodes.length === 0) {
      return NextResponse.json({ error: "No episodes in playlist" }, { status: 404 });
    }

    // Dernier épisode
    const latestEpisode = playlistEpisodes[0];
    const audioUrl = `/api/podcast-stream/${latestEpisode.id}?ts=${Date.now()}`;

    if (wantsJson) {
      return NextResponse.json({
        playlist: {
          id: playlist.id,
          title: playlist.title,
          trackCount: playlist.trackCount,
        },
        latestEpisode: {
          id: latestEpisode.id,
          title: latestEpisode.title,
          audioUrl,
        },
      });
    }

    return NextResponse.redirect(audioUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
