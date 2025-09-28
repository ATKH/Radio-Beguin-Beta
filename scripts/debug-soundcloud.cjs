const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: "commonjs" });
require("ts-node/register");
const { writeFile, mkdir } = require("fs/promises");

async function main() {
  const { fetchAggregatedSoundCloudData } = require("../src/lib/soundcloud/fetcher");

  const outputDir = path.join(process.cwd(), "src/data");
  await mkdir(outputDir, { recursive: true });

  const data = await fetchAggregatedSoundCloudData();
  const outputPath = path.join(outputDir, "podcasts.json");
  await writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");

  console.log(`✅ Données podcasts mises à jour : ${outputPath}`);
}

main().catch(error => {
  console.error("❌ Erreur lors de la mise à jour du cache SoundCloud:", error);
  process.exit(1);
});
