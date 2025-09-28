export interface PodcastEpisode {
  id: string;
  title: string;
  artworkUrl: string;
  pubDate: string;
  link: string;
  description?: string;
  tags?: string[];
  audioUrl: string | null;
  sharing?: "public" | "private"; // <- ajouté
}
