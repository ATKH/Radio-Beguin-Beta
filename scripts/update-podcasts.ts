// scripts/update-podcasts.ts
// ⚠️ Doit rester le premier import : charge .env.local avant les modules SoundCloud.
import "./load-env";
import path from "path";
import { writeFile, readFile, mkdir } from "fs/promises";
import { fetchAggregatedSoundCloudData } from "@/lib/soundcloud/fetcher";

import { getAccessToken } from "@/lib/soundcloud/auth";

type PodcastEntry = { url?: string; [key: string]: unknown };

// Abandonne avec un message clair si SoundCloud ne répond pas,
// au lieu de rester bloqué indéfiniment.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} : pas de réponse après ${ms / 1000} s`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// Supporte les deux formes de cache : tableau brut ou objet { podcasts: [...] }
function extractList(data: unknown): PodcastEntry[] | null {
  if (Array.isArray(data)) return data as PodcastEntry[];
  if (data && typeof data === "object" && Array.isArray((data as any).podcasts)) {
    return (data as any).podcasts as PodcastEntry[];
  }
  return null;
}

async function main() {
  try {
    // Vérifie qu’on a un token valide (utile pour fetcher SoundCloud en local)
    const token = await withTimeout(getAccessToken(), 30_000, "Jeton SoundCloud");
    if (!token) {
      console.warn("⚠️ Aucun access_token SoundCloud valide. Mode fallback public.");
    }

    // Récupère toutes les données SoundCloud (épisodes + playlists)
    const data = await withTimeout(
      fetchAggregatedSoundCloudData(),
      900_000,
      "Récupération SoundCloud"
    );

    // 👉 Ajout d'un timestamp pour forcer un changement Git
    (data as any).lastUpdated = new Date().toISOString();

    const outputDir = path.join(process.cwd(), "public/data");
    await mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, "podcasts.json");

    // 🛡️ Lit l’ancien cache pour ne jamais écraser de bonnes données avec un résultat partiel
    let previous: unknown = null;
    try {
      previous = JSON.parse(await readFile(outputPath, "utf8"));
    } catch {
      // pas de cache précédent : rien à protéger
    }

    const prevList = extractList(previous);
    const nextList = extractList(data);

    if (prevList && prevList.length > 0) {
      if (!nextList || nextList.length === 0) {
        // Plus rien ne résout (ex : 401) → on garde l’ancien cache, on n’écrit pas
        console.error(
          `❌ ${prevList.length} podcast(s) en cache mais 0 récupéré — écriture annulée, ancien cache conservé.`
        );
        process.exit(1);
      }

      if (nextList.length < prevList.length) {
        // Fusion : réinjecte les entrées dont l’URL n’a pas pu être résolue
        const nextUrls = new Set(nextList.map((p) => p?.url).filter(Boolean));
        const kept = prevList.filter((p) => p?.url && !nextUrls.has(p.url));
        if (kept.length > 0) {
          console.warn(
            `⚠️ ${kept.length} podcast(s) non résolu(s) — conservés depuis l’ancien cache.`
          );
          if (Array.isArray(data)) {
            (data as unknown as PodcastEntry[]).push(...kept);
          } else {
            (data as any).podcasts = [...nextList, ...kept];
          }
        }
      }
    }

    const json = JSON.stringify(data, null, 2);

    // Sauvegarde dans public/data/podcasts.json (accessible en prod via /data/podcasts.json)
    await writeFile(outputPath, json, "utf8");

    // Miroir dans src/data/podcasts.json (importé par le site) — fini le cp manuel
    const srcDataDir = path.join(process.cwd(), "src/data");
    await mkdir(srcDataDir, { recursive: true });
    await writeFile(path.join(srcDataDir, "podcasts.json"), json, "utf8");

    console.log(`✅ Données podcasts mises à jour : ${outputPath}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du cache SoundCloud:", error);
    process.exit(1); // code d’erreur réel — un cache cassé ne doit pas passer silencieusement
  }
}

main();