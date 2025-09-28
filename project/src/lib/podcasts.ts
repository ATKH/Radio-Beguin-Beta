import Parser from 'rss-parser';

export interface PodcastEpisode {
  id: string;
  title: string;
  artworkUrl: string;
  pubDate: string;
  link: string;
  description?: string;
  tags?: string[];
}

const parser = new Parser();

export async function fetchPodcastEpisodes(): Promise<PodcastEpisode[]> {
  try {
    const feed = await parser.parseURL('https://feeds.soundcloud.com/users/soundcloud:users:815775241/sounds.rss'); // remplace par ton RSS

    return feed.items.map((item: any) => ({
      id: item.guid || item.id || item.link || item.title,
      title: item.title || 'Sans titre',
      artworkUrl: item.itunes?.image || feed.image?.url || '/default-artwork.jpg',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      link: item.link || '#',
      description: item.contentSnippet || item.description,
      tags: item.categories || [],
    }));
  } catch (error) {
    console.error('Erreur fetchPodcastEpisodes:', error);
    return [];
  }
}
