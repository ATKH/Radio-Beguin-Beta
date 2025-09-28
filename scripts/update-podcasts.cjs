const path = require("path");
const { writeFile, mkdir } = require("fs/promises");

// Charger .env.local
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

// Import dynamique du fetcher (comme dans tes autres scripts)
async function main() {
  const { fetchAggregatedSoundCloudData } = require("../src/lib/soundcloud/fetcher");

  // Nouveau dossier "data" à la racine du projet
  const outputDir = path.join(process.cwd(), "data");
  await mkdir(outputDir, { recursive: true });

  // Récupérer toutes les données SoundCloud
  const data = await fetchAggregatedSoundCloudData();

  // Sauvegarde dans data/podcasts.json
  const outputPath = path.join(outputDir, "podcasts.json");
  await writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");

  console.log(`✅ Données podcasts mises à jour : ${outputPath}`);
}

main().catch(error => {
  console.error("❌ Erreur lors de la mise à jour du cache SoundCloud:", error);
  process.exit(1);
});
