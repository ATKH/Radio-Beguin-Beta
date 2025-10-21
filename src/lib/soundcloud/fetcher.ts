import { getAccessToken, invalidateAccessToken } from "./auth";
import overrides from "@/data/podcast-overrides.json";
import type { PodcastEpisode, PodcastPlaylist, PodcastAggregatedData } from "../podcasts.types";

const USER_ID = "815775241";
// src/lib/soundcloud/fetcher.ts
const MIN_PUBLICATION_DATE = new Date("2018-01-01T00:00:00Z");
// ou carrément new Date(0) pour tout récupérer

type EpisodeOverride = {
  tags?: string[];
};

type PodcastOverrides = {
  episodes?: Record<string, EpisodeOverride>;
};

const PODCAST_OVERRIDES: PodcastOverrides = overrides;

function applyEpisodeOverrides(episodes: PodcastEpisode[]): void {
  const map = PODCAST_OVERRIDES.episodes;
  if (!map) return;

  episodes.forEach(episode => {
    const override = map[episode.id];
    if (!override) return;

    if (override.tags) {
      episode.tags = [...override.tags];
    }
  });
}


function canonicalKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatDisplayTag(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/["'`]/g, "")
    .replace(/[\s_/]+/g, " ")
    .replace(/\s*&\s*/g, " & ")
    .replace(/\s+,\s*/g, ", ")
    .trim();

  if (!cleaned) return null;

  const words = cleaned
    .split(" ")
    .filter(Boolean)
    .map(word => {
      const lower = word.toLowerCase();
      if (lower.length <= 3) {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    });

  if (words.length === 0) return null;

  return words.join(" ").replace(/\s+,/g, ",").trim();
}

const TAG_SYNONYMS: Record<string, string> = {
  "latin": "Latin Music",
  "latin music": "Latin Music",
  "musique latine": "Latin Music",
  "musica latina": "Latin Music",
  "brazil": "Brazil",
  "brasil": "Brazil",
  "bresil": "Brazil",
  "brasilia": "Brazil",
  "musique bresilienne": "Brazil",
  "field recording": "Field Recording",
  "field recordings": "Field Recording",
  "fields recording": "Field Recording",
  "fields recordings": "Field Recording",
  "letfield techno": "Leftfield Techno",
  "letfield": "Leftfield",
  "leftfield": "Leftfield",
  "leftfield tehcno": "Leftfield Techno",
  "gqom": "Gqom",
  "drum n bass": "Drum & Bass",
  "drumnbass": "Drum & Bass",
  "hyper pop": "Hyperpop",
  "hyperpop": "Hyperpop",
  "synth pop": "Synth Pop",
  "synthpop": "Synth Pop",
  "dub": "Dub",
};

const TAG_EXCLUSIONS = new Set<string>([
  "radio beguin",
  "radio",
  "beguin",
  "terrasse",
  "terrasses",
  "reveil",
  "playlist",
  "live",
]);

function normalizeDisplayTag(raw?: string | null): string | null {
  const formatted = formatDisplayTag(raw);
  if (!formatted) return null;

  const initialKey = canonicalKey(formatted);
  if (TAG_EXCLUSIONS.has(initialKey)) return null;

  const synonym = TAG_SYNONYMS[initialKey];
  const value = synonym ?? formatted;
  const finalKey = canonicalKey(value);
  if (TAG_EXCLUSIONS.has(finalKey)) return null;

  return value;
}

interface SCTrack {
  id: number;
  title: string;
  created_at: string;
  permalink_url: string;
  description?: string;
  genre?: string;
  tag_list?: string;
  artwork_url?: string;
  user?: { avatar_url?: string };
  sharing?: "public" | "private";
  track_authorization?: string;
  media?: {
    transcodings?: Array<{
      url: string;
      format?: { protocol?: "progressive" | "hls"; mime_type?: string };
    }>;
  };
  duration?: number;
}

interface SCPlaylist {
  id: number;
  title: string;
  permalink_url: string;
  description?: string;
  artwork_url?: string;
  created_at: string;
  last_modified?: string;
  track_count?: number;
  genre?: string;
  tag_list?: string;
  tracks?: SCTrack[];
}

function parseTagList(raw?: string, limit = Infinity): string[] {
  if (!raw) return [];
  const tags: string[] = [];
  const regex = /"([^"]+)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw))) {
    const tag = (match[1] || match[2] || "").trim();
    if (tag) tags.push(tag);
    if (tags.length >= limit) break;
  }
  return tags;
}

function normalizeArtwork(url?: string | null): string {
  if (!url) return "/default-artwork.jpg";
  return url.replace("-large", "-t500x500");
}

async function resolveStreamUrl(
  transcodingUrl: string,
  trackAuthorization?: string,
  attempt = 0
): Promise<string | null> {
  const token = await getAccessToken();
  const url = new URL(transcodingUrl);
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  if (!token && clientId && !url.searchParams.has("client_id")) {
    url.searchParams.set("client_id", clientId);
  }
  if (trackAuthorization && !url.searchParams.has("track_authorization")) {
    url.searchParams.set("track_authorization", trackAuthorization);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `OAuth ${token}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    cache: "no-store",
  });

  if ((res.status === 401 || res.status === 403) && attempt < 1) {
    console.warn(
      "⚠️ resolveStreamUrl non autorisé (tentative %s). Nouvel essai sans invalider le token.",
      attempt + 1
    );
    return resolveStreamUrl(transcodingUrl, trackAuthorization, attempt + 1);
  }

  if (!res.ok) {
    console.warn("⚠️ resolveStreamUrl échoue:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return typeof data?.url === "string" ? data.url : null;
}

async function fetchStreamFallback(
  trackId: number,
  trackAuthorization?: string
): Promise<{ progressive?: string; hls?: string }> {
  const url = new URL(`https://api.soundcloud.com/i1/tracks/${trackId}/streams`);
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  if (trackAuthorization) url.searchParams.set("track_authorization", trackAuthorization);

  const headers: Record<string, string> = {};
  try {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `OAuth ${token}`;
    } else if (clientId && !url.searchParams.has("client_id")) {
      url.searchParams.set("client_id", clientId);
    }
  } catch (error) {
    console.warn("⚠️ Impossible de récupérer un token pour le fallback:", error);
  }

  try {
    const res = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(
        "⚠️ fetchStreamFallback échoue: %s %s",
        res.status,
        await res.text()
      );
      return {};
    }

    const data: Record<string, string | undefined> = await res.json();

    if (data.access && data.access !== 'playable') {
      console.warn(
        "⚠️ Track %s n'autorise pas le streaming API (access=%s).",
        trackId,
        data.access
      );
      return {};
    }

    const progressive =
      data.http_mp3_320_url ||
      data.http_mp3_192_url ||
      data.http_mp3_128_url ||
      data.http_mp3_64_url ||
      data.http_mp3_32_url;
    const hls =
      data.hls_mp3_320_url ||
      data.hls_mp3_192_url ||
      data.hls_mp3_128_url ||
      data.hls_mp3_64_url ||
      data.hls_mp3_32_url;
    return {
      progressive: progressive ?? undefined,
      hls: hls ?? undefined,
    };
  } catch (error) {
    console.warn("⚠️ fetchStreamFallback exception:", error);
    return {};
  }
}

async function fetchTrackDetails(trackId: number, attempt = 0): Promise<SCTrack | null> {
  const token = await getAccessToken();
  const url = new URL(`https://api.soundcloud.com/tracks/${trackId}`);
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  if (!token && clientId && !url.searchParams.has("client_id")) {
    url.searchParams.set("client_id", clientId);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `OAuth ${token}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    cache: "no-store",
  });

  if ((res.status === 401 || res.status === 403) && attempt < 1) {
    console.warn(
      "⚠️ fetchTrackDetails non autorisé (track_id=%s). Nouvelle tentative sans invalider le token.",
      trackId
    );
    return fetchTrackDetails(trackId, attempt + 1);
  }

  if (!res.ok) {
    console.warn("⚠️ fetchTrackDetails échoue:", trackId, res.status, await res.text());
    return null;
  }

  return (await res.json()) as SCTrack;
}

async function fetchAllTracks(): Promise<SCTrack[]> {
  let url: string | null = `https://api.soundcloud.com/users/${USER_ID}/tracks?limit=200&linked_partitioning=1`;
  const tracks: SCTrack[] = [];
  let authFailures = 0;

  while (url) {
    const token = await getAccessToken();
    const res = await fetch(url, {
      headers: { Authorization: `OAuth ${token}` },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      invalidateAccessToken();
      authFailures += 1;
      if (authFailures >= 3) break;
      continue;
    }

    authFailures = 0;

    if (!res.ok) {
      console.warn("⚠️ fetchAllTracks échoue:", res.status, await res.text());
      break;
    }

    type SCListResponse = { collection?: SCTrack[]; next_href?: string | null };
    const data: SCListResponse = await res.json();
    if (Array.isArray(data?.collection)) {
      tracks.push(...data.collection);
    }
    url = data?.next_href ?? null;
  }

  return tracks;
}

function transformTrackToEpisode(track: SCTrack, trackData: SCTrack): PodcastEpisode {
  const artwork = normalizeArtwork(trackData.artwork_url || trackData.user?.avatar_url);
  const tagMap = new Map<string, string>();

  const pushTag = (raw?: string | null) => {
    if (!raw) return;
    const cleaned = raw.replace(/^#+/, "").trim();
    if (!cleaned) return;
    if (tagMap.has(cleaned)) return;
    tagMap.set(cleaned, cleaned);
  };

  pushTag(trackData.genre ?? track.genre);

  parseTagList(trackData.tag_list, 3).forEach(tag => pushTag(tag));

  return {
    id: String(trackData.id ?? track.id),
    title: trackData.title ?? track.title,
    artworkUrl: artwork,
    pubDate: trackData.created_at ?? track.created_at,
    link: trackData.permalink_url ?? track.permalink_url,
    description: trackData.description ?? track.description ?? "",
    tags: Array.from(tagMap.values()),
    audioUrl: "",
    streamProtocol: undefined,
    sharing: trackData.sharing,
    trackAuthorization: trackData.track_authorization ?? null,
  };
}

async function buildEpisodes(): Promise<PodcastEpisode[]> {
  const tracks = await fetchAllTracks();
  const episodes: PodcastEpisode[] = [];

  for (const track of tracks) {
    if (track.sharing && track.sharing !== "public") continue;

    const createdAt = new Date(track.created_at);
    if (!Number.isNaN(createdAt.getTime()) && createdAt < MIN_PUBLICATION_DATE) continue;

    let trackData = track;
    if (!track.media?.transcodings?.length) {
      const detailed = await fetchTrackDetails(track.id);
      if (detailed) {
        trackData = {
          ...track,
          ...detailed,
          media: detailed.media ?? track.media,
          track_authorization: detailed.track_authorization ?? track.track_authorization,
        };
      }
    }

    const episode = transformTrackToEpisode(track, trackData);

    // Résolution des URLs audio (progressive / HLS)
    if (trackData.media?.transcodings?.length) {
      const progressive = trackData.media.transcodings.find(t => t.format?.protocol === "progressive");
      if (progressive?.url) {
        const resolved = await resolveStreamUrl(progressive.url, trackData.track_authorization);
        if (resolved) {
          episode.audioUrl = resolved;
          episode.streamProtocol = "progressive";
        }
      }

      if (!episode.audioUrl) {
        const hls = trackData.media.transcodings.find(t => t.format?.protocol === "hls");
        if (hls?.url) {
          const resolved = await resolveStreamUrl(hls.url, trackData.track_authorization);
          if (resolved) {
            episode.audioUrl = resolved;
            episode.streamProtocol = "hls";
          }
        }
      }
    }

    if (!episode.audioUrl) {
      const { progressive, hls } = await fetchStreamFallback(trackData.id ?? track.id, trackData.track_authorization);
      if (progressive) {
        episode.audioUrl = progressive;
        episode.streamProtocol = "progressive";
      } else if (hls) {
        episode.audioUrl = hls;
        episode.streamProtocol = "hls";
      }
    }

    episodes.push(episode);
  }

  return episodes;
}

async function buildPlaylists(episodes: PodcastEpisode[]): Promise<PodcastPlaylist[]> {
  let url: string | null = `https://api.soundcloud.com/users/${USER_ID}/playlists?limit=200&linked_partitioning=1`;
  const collections: SCPlaylist[] = [];
  let authFailures = 0;

  while (url) {
    const token = await getAccessToken();
        const res = await fetch(url, {
          headers: { Authorization: `OAuth ${token}` },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      invalidateAccessToken();
      authFailures += 1;
      if (authFailures >= 3) break;
      continue;
    }

    authFailures = 0;

    if (!res.ok) {
      console.warn("⚠️ fetch playlists échoue:", res.status, await res.text());
      break;
    }

    type PlaylistResponse = { collection?: SCPlaylist[]; next_href?: string | null };
    const data: PlaylistResponse = await res.json();
    if (Array.isArray(data?.collection)) {
      collections.push(...data.collection);
    }
    url = data?.next_href ?? null;
  }

  const episodeMap = new Map(episodes.map(ep => [ep.id, ep]));
  const playlists: PodcastPlaylist[] = [];

  for (const playlist of collections) {
    const artwork = normalizeArtwork(
      playlist.artwork_url || playlist.tracks?.[0]?.artwork_url || undefined
    );

    const tagMap = new Map<string, string>();
    const pushTag = (raw?: string | null) => {
      const formatted = normalizeDisplayTag(raw);
      if (!formatted) return;
      const key = canonicalKey(formatted);
      if (!key || tagMap.has(key)) return;
      tagMap.set(key, formatted);
    };

    parseTagList(playlist.tag_list, 3).forEach(tag => pushTag(tag));

    const episodeIds = (playlist.tracks ?? [])
      .map(track => (track?.id ? String(track.id) : null))
      .filter((id): id is string => Boolean(id));

    const playlistEpisodes = episodeIds
      .map(id => episodeMap.get(id))
      .filter((ep): ep is PodcastEpisode => Boolean(ep));

    const latestEpisode = playlistEpisodes
      .slice()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())[0];

    playlists.push({
      id: String(playlist.id),
      title: playlist.title,
      artworkUrl: artwork,
      description: playlist.description || "",
      permalinkUrl: playlist.permalink_url,
      trackCount: playlist.track_count ?? playlist.tracks?.length ?? episodeIds.length,
      tags: Array.from(tagMap.values()),
      lastUpdated: playlist.last_modified || playlist.created_at,
      episodeIds,
      latestEpisode,
    });
  }

  return playlists;
}

export async function fetchAggregatedSoundCloudData(): Promise<PodcastAggregatedData> {
  const episodes = await buildEpisodes();
  applyEpisodeOverrides(episodes);
  const playlists = await buildPlaylists(episodes);

  const tagCounts = new Map<string, number>();
  const registerTag = (tag: string) => {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  };

  episodes.forEach(ep => {
    ep.tags?.forEach(registerTag);
  });

  playlists.forEach(pl => {
    pl.tags.forEach(registerTag);
  });

  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], undefined, { sensitivity: "base" });
    })
    .map(([tag]) => tag);

  return {
    episodes,
    playlists,
    tags: sortedTags,
  };
}
