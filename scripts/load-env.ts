import path from "path";
import dotenv from "dotenv";

// Doit être importé EN PREMIER dans les scripts : les imports sont exécutés dans l'ordre,
// et src/lib/soundcloud/* lit process.env au chargement.
// override: true → .env.local (token fraîchement écrit par soundcloud:authorize)
// prime sur un éventuel vieux token exporté dans le shell.
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });