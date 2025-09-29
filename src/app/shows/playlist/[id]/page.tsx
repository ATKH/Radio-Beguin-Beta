// src/app/shows/playlist/[id]/page.tsx
import { notFound } from "next/navigation";
import PlaylistClient from "../PlaylistClient";
import { fetchPodcastEpisodes, fetchPodcastPlaylists } from "@/lib/podcasts";

export default async function PlaylistPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const playlistId = decodeURIComponent(id);

  const [playlists, episodes] = await Promise.all([
    fetchPodcastPlaylists(),
    fetchPodcastEpisodes(),
  ]);

  const playlist = playlists.find((pl) => pl.id === playlistId);
  if (!playlist) return notFound();

  const episodeMap = new Map(episodes.map((ep) => [ep.id, ep]));
  const playlistEpisodes = playlist.episodeIds
    .map((epId) => {
      const ep = episodeMap.get(epId);
      if (!ep) return null;

      return {
        ...ep,
        audioUrl: `/api/podcast-stream/${ep.id}?ts=${Date.now()}`, // ✅ proxy comme pour PlayerContext
        streamProtocol: "progressive" as const,
      };
    })
    .filter((ep): ep is NonNullable<typeof ep> => Boolean(ep));

  return <PlaylistClient playlist={playlist} episodes={playlistEpisodes} />;
}
