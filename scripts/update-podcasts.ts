import path from "path";
import { writeFile, mkdir } from "fs/promises";
import dotenv from "dotenv";
import { fetchAggregatedSoundCloudData } from "@/lib/soundcloud/fetcher";

// @ts-ignore – on autorise l'import CommonJS
import { getAccessToken } from "./auth.cjs";

// Charger les variables d’environnement
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  try {
    // Vérifie qu’on a un token valide
    const token = await getAccessToken();
    if (!token) {
      console.warn("⚠️ Aucun access_token SoundCloud valide. Mode fallback public.");
    }

    // Récupère toutes les données SoundCloud (épisodes + playlists)
    const data = await fetchAggregatedSoundCloudData();

    // Sauvegarde le JSON dans src/data/podcasts.json
    const outputDir = path.join(process.cwd(), "src/data");
    await mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, "podcasts.json");
    await writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Données podcasts mises à jour : ${outputPath}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du cache SoundCloud:", error);
    process.exit(0); // ⚠️ on ne bloque pas le build
  }
}

main();
