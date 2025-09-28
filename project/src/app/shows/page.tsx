import { fetchPodcastEpisodes, PodcastEpisode } from "@/lib/podcasts";
import ShowsClient from "./ShowsClient";

export default async function ShowsPage() {
  // ✅ Récupération des épisodes côté serveur
  const episodes: PodcastEpisode[] = await fetchPodcastEpisodes();

  // Passe les épisodes au Client Component pour l’interactivité
  return <ShowsClient episodes={episodes} />;
}
