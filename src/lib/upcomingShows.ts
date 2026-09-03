import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const KV_KEY = "radio-beguin:upcoming-shows";

export type UpcomingShow = {
  id: string;
  mode: "playlist" | "manual";
  playlistId?: string;
  title: string;
  image: string;
  link?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // ex: "20h", "20h30", "20"
};

function parseTimeToHHMM(time: string | undefined): string {
  if (!time) return "00:00";
  let t = time.trim().toLowerCase().replace("h", ":");
  if (t.endsWith(":")) t = t + "00";
  if (!t.includes(":")) t = t + ":00";
  const parts = t.split(":");
  const hours = (parts[0] || "0").padStart(2, "0");
  const minutes = (parts[1] || "00").padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function getAllUpcomingShows(): Promise<UpcomingShow[]> {
  try {
    const stored = await redis.get<UpcomingShow[]>(KV_KEY);
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Erreur lecture émissions à venir Redis:", error);
    return [];
  }
}

export async function getUpcomingShowsSorted(): Promise<UpcomingShow[]> {
  const all = await getAllUpcomingShows();
  const now = new Date();
  return all
    .filter((show) => {
      if (!show.date) return false;
      const hhmm = parseTimeToHHMM(show.time);
      const showDateTime = new Date(`${show.date}T${hhmm}:00`);
      if (isNaN(showDateTime.getTime())) return false;
      return showDateTime.getTime() >= now.getTime() - 60 * 60 * 1000; // garde 1h de marge
    })
    .sort((a, b) => {
      const aKey = `${a.date} ${parseTimeToHHMM(a.time)}`;
      const bKey = `${b.date} ${parseTimeToHHMM(b.time)}`;
      return aKey.localeCompare(bKey);
    });
}

export async function saveUpcomingShows(shows: UpcomingShow[]): Promise<void> {
  await redis.set(KV_KEY, shows);
}
