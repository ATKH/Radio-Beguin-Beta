import { notFound } from "next/navigation";
import PlaylistClient from "../PlaylistClient";
import { fetchPodcastEpisodes, fetchPodcastPlaylists } from "@/lib/podcasts";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlistId = decodeURIComponent(id);

  const [playlists, episodes] = await Promise.all([
    fetchPodcastPlaylists(),
    fetchPodcastEpisodes(),
  ]);

  const playlist = playlists.find(pl => pl.id === playlistId);
  if (!playlist) return notFound();

  const episodeMap = new Map(episodes.map(ep => [ep.id, ep]));
  const playlistEpisodes = playlist.episodeIds
    .map(epId => episodeMap.get(epId))
    .filter((ep): ep is typeof episodes[number] => Boolean(ep));

  return <PlaylistClient playlist={playlist} episodes={playlistEpisodes} />;
}
