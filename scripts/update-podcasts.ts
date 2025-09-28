import path from "path";
import { writeFile, mkdir } from "fs/promises";
import dotenv from "dotenv";
import { fetchAggregatedSoundCloudData } from "@/lib/soundcloud/fetcher";

// @ts-ignore – import CommonJS
import { getAccessToken } from "./auth.cjs";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn("⚠️ Aucun access_token SoundCloud valide. Mode fallback public.");
    }

    const data = await fetchAggregatedSoundCloudData();

    // 👉 Ajouter une date de mise à jour pour forcer un diff Git
    const payload = {
      lastUpdated: new Date().toISOString(),
      ...data,
    };

    const outputDir = path.join(process.cwd(), "src/data");
    await mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, "podcasts.json");
    await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");

    console.log(`✅ Données podcasts mises à jour : ${outputPath}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du cache SoundCloud:", error);
    process.exit(0);
  }
}

main();
