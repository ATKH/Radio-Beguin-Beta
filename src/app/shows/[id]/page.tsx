import { notFound } from "next/navigation";
import ShowClient from "./ShowClient";
import { fetchPodcastEpisodes } from "@/lib/podcasts";

type ShowPageProps = {
  params: { id: string };
};

export default async function ShowPage({ params }: ShowPageProps) {
  const { id } = params; // plus besoin de await
  const episodeId = decodeURIComponent(id);

  // Appel direct à la lib => pas besoin de passer par /api/podcasts
  const episodes = await fetchPodcastEpisodes();
  const episode = episodes.find(ep => ep.id === episodeId);

  if (!episode) return notFound();

  return <ShowClient episode={episode} />;
}
