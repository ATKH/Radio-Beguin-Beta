import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const STREAM_CONFIG_KEY = "radio:active-stream";

export type StreamSource = "main" | "backup";

export const STREAM_URLS: Record<StreamSource, string> = {
  main: "https://stream.radiobeguin.com/listen/radio_b%C3%A9guin/radio.mp3",
  backup: "https://studio.ondezero.net/listen/radio_beguin/radio.mp3",
};

export const NOWPLAYING_URLS: Record<StreamSource, string> = {
  main: "https://stream.radiobeguin.com/api/nowplaying/1",
  backup: "https://studio.ondezero.net/api/nowplaying/radio_beguin",
};

export const STREAM_LABELS: Record<StreamSource, string> = {
  main: "Radio Béguin (stream.radiobeguin.com)",
  backup: "Backup (studio.ondezero.net)",
};

export async function getActiveStreamSource(): Promise<StreamSource> {
  try {
    const stored = await redis.get<StreamSource>(STREAM_CONFIG_KEY);
    if (stored === "main" || stored === "backup") return stored;
  } catch (error) {
    console.error("Erreur lecture config stream:", error);
  }
  return "main";
}

export async function setActiveStreamSource(source: StreamSource): Promise<void> {
  if (source !== "main" && source !== "backup") {
    throw new Error(`Source de stream invalide: ${source}`);
  }
  await redis.set(STREAM_CONFIG_KEY, source);
}

export function getActiveStreamUrl(source: StreamSource): string {
  return STREAM_URLS[source];
}
