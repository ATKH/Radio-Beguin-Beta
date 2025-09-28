require("dotenv").config({ path: ".env.local" });
require("ts-node/register");

const { buildEpisodes } = require("../src/lib/soundcloud/fetcher");

async function main() {
  const episodes = await buildEpisodes();
  for (const [index, episode] of episodes.entries()) {
    console.log(index + 1, episode.title, episode.audioUrl);
  }
}

main().catch(console.error);
