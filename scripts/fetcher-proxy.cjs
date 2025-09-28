const path = require("path");

// En local, active ts-node pour charger le TS
try {
  require("ts-node/register");
} catch (e) {
  // En prod (Vercel), Next aura compilé les fichiers en JS
}

// Import du fetcher TypeScript
const fetcher = require(path.join(process.cwd(), "src/lib/soundcloud/fetcher.ts"));

module.exports = fetcher;
