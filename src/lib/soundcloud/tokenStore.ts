import fs from "fs";
import path from "path";

const tokensFile = path.join(process.cwd(), "src/lib/soundcloud/tokens.json");

function getEnvRefreshToken(): string | null {
  const raw = process.env.SOUNDCLOUD_REFRESH_TOKEN;
  return raw && raw.trim().length > 0 ? raw.trim() : null;
}

export function readRefreshToken(): string | null {
  const candidates = readRefreshTokenCandidates();
  return candidates.length > 0 ? candidates[0] : null;
}

export function writeRefreshToken(refreshToken: string) {
  const sanitized = refreshToken.trim();
  if (!sanitized) return;

  try {
    fs.mkdirSync(path.dirname(tokensFile), { recursive: true });
    fs.writeFileSync(tokensFile, JSON.stringify({ refresh_token: sanitized }, null, 2), "utf8");
  } catch (error) {
    console.warn("⚠️ Impossible d'écrire tokens.json (environnement en lecture seule ?) :", error);
  }
}

export function readRefreshTokenCandidates(): string[] {
  const candidates = new Set<string>();

  const fromEnv = getEnvRefreshToken();
  if (fromEnv) candidates.add(fromEnv);

  try {
    if (fs.existsSync(tokensFile)) {
      const raw = fs.readFileSync(tokensFile, "utf8");
      if (raw.trim().length === 0) {
        return Array.from(candidates);
      }

      const tokens = JSON.parse(raw);
      const fileToken = typeof tokens.refresh_token === "string" ? tokens.refresh_token.trim() : "";
      if (fileToken) candidates.add(fileToken);
      const historyTokens: unknown = tokens.history;
      if (Array.isArray(historyTokens)) {
        for (const entry of historyTokens) {
          if (typeof entry === "string" && entry.trim()) {
            candidates.add(entry.trim());
          }
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Impossible de lire tokens.json:", error);
  }

  return Array.from(candidates);
}
