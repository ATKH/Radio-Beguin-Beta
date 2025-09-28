import { notFound } from "next/navigation";
import { fetchPodcastEpisodes, PodcastEpisode } from "@/lib/podcasts";
import ShowClient from "./ShowClient";

type ShowPageProps = {
  params: { id: string | Promise<string> };
};

export default async function ShowPage({ params }: ShowPageProps) {
  // ✅ Résolution de l'id si c'est une promesse
  const resolvedId = typeof params.id === "string" ? params.id : await params.id;
  const id = decodeURIComponent(resolvedId.trim());

  const episodes = await fetchPodcastEpisodes();

  // Cherche l’épisode correspondant
  const episode = episodes.find(
    (ep) => ep.id === id || ep.id.includes(id) || id.includes(ep.id)
  );

  if (!episode) return notFound();

  // Passe l'épisode à un Client Component pour l’interactivité
  return <ShowClient episode={episode} />;
}
