export interface PodcastEpisode {
  id: string;
  title: string;
  artworkUrl: string;
  pubDate: string;
  link: string;
  description?: string;
  tags?: string[];
  audioUrl: string; // vide = non lisible
  streamProtocol?: "progressive" | "hls";
  sharing?: "public" | "private";
  trackAuthorization?: string | null;
}

export interface PodcastPlaylist {
  id: string;
  title: string;
  artworkUrl: string;
  description?: string;
  permalinkUrl: string;
  trackCount: number;
  tags: string[];
  lastUpdated?: string;
  episodeIds: string[];
  latestEpisode?: PodcastEpisode;
}

export interface PodcastAggregatedData {
  episodes: PodcastEpisode[];
  playlists: PodcastPlaylist[];
  tags: string[];
}
