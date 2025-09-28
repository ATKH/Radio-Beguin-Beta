// scripts/update-podcasts.cjs
const path = require("path");
const { writeFile, mkdir } = require("fs/promises");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

// Auth simplifiée pour Vercel
const { getAccessToken } = require("./auth.cjs");

const USER_ID = "815775241"; // ton SoundCloud user ID

async function authFetch(url, opts = {}) {
  const token = await getAccessToken();
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `OAuth ${token}`,
    },
  });
}

async function fetchAllTracks() {
  let url = `https://api.soundcloud.com/users/${USER_ID}/tracks?limit=200&linked_partitioning=1`;
  const tracks = [];

  while (url) {
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`Tracks fetch failed: ${res.status}`);

    const data = await res.json();
    if (Array.isArray(data.collection)) {
      tracks.push(...data.collection);
    }
    url = data.next_href || null;
  }

  return tracks;
}

async function fetchAllPlaylists() {
  let url = `https://api.soundcloud.com/users/${USER_ID}/playlists?limit=200&linked_partitioning=1`;
  const playlists = [];

  while (url) {
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`Playlists fetch failed: ${res.status}`);

    const data = await res.json();
    if (Array.isArray(data.collection)) {
      playlists.push(...data.collection);
    }
    url = data.next_href || null;
  }

  return playlists;
}

async function main() {
  const [tracks, playlists] = await Promise.all([
    fetchAllTracks(),
    fetchAllPlaylists(),
  ]);

  const aggregated = {
    episodes: tracks.map((t) => ({
      id: String(t.id),
      title: t.title,
      pubDate: t.created_at,
      link: t.permalink_url,
      description: t.description || "",
      artworkUrl: t.artwork_url || (t.user?.avatar_url ?? ""),
      sharing: t.sharing,
    })),
    playlists: playlists.map((pl) => ({
      id: String(pl.id),
      title: pl.title,
      permalinkUrl: pl.permalink_url,
      description: pl.description || "",
      artworkUrl: pl.artwork_url || "",
      trackCount: pl.track_count,
      episodeIds: (pl.tracks || []).map((tr) => String(tr.id)),
    })),
  };

  const outputDir = path.join(process.cwd(), "src/data");
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "podcasts.json");
  await writeFile(outputPath, JSON.stringify(aggregated, null, 2), "utf8");

  console.log(`✅ Données podcasts mises à jour : ${outputPath}`);
}

main().catch((error) => {
  console.error("❌ Erreur lors de la mise à jour du cache SoundCloud:", error);
  process.exit(1);
});
