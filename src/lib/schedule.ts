import { Redis } from "@upstash/redis";
import type { WeeklyScheduleConfig } from "@/components/WeeklySchedule";

const redis = Redis.fromEnv();

const KV_KEY = "radio-beguin:schedule";
const SPECIAL_EVENTS_KEY = "radio-beguin:special-events";

export type SpecialEvent = {
  id: string;
  date: string; // format "YYYY-MM-DD"
  time: string; // ex: "20h"
  label: string;
  translations?: { en?: string };
  link?: string;
  mode: "add" | "replace"; // "add" = s'ajoute au planning du jour, "replace" = remplace tout le planning du jour
};

const SCHEDULE_LABELS = {
  night: { fr: "Playlist de la nuit", en: "Night time playlist" },
  ambient: { fr: "Playlist méditative", en: "Meditative playlist" },
  morning: { fr: "Playlist plutôt tranquille", en: "Rather calm playlist" },
  day: { fr: "Playlist un peu moins tranquille", en: "Slightly less calm playlist" },
  evening: { fr: "Playlist un peu plus club", en: "Club-oriented playlist" },
} satisfies Record<string, { fr: string; en: string }>;

const makeSlot = (time: string, key: keyof typeof SCHEDULE_LABELS) => {
  const labels = SCHEDULE_LABELS[key];
  return {
    time,
    label: labels.fr,
    translations: { en: labels.en },
  };
};

// Ton planning actuel, sert de valeur par défaut / filet de sécurité si Redis est vide ou indisponible
export const DEFAULT_SCHEDULE: WeeklyScheduleConfig = {
  Lundi: [
    makeSlot("00h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
  ],
  Mardi: [
    makeSlot("00h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
  ],
  Mercredi: [
    makeSlot("00h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
  ],
  Jeudi: [
    makeSlot("00h", "evening"),
    makeSlot("01h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
    makeSlot("22h", "evening"),
  ],
  Vendredi: [
    makeSlot("00h", "evening"),
    makeSlot("01h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
  ],
  Samedi: [
    makeSlot("00h", "evening"),
    makeSlot("01h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("07h", "morning"),
    makeSlot("13h", "day"),
    makeSlot("22h", "evening"),
  ],
  Dimanche: [
    makeSlot("00h", "evening"),
    makeSlot("01h", "night"),
    makeSlot("05h", "ambient"),
    makeSlot("08h", "morning"),
    makeSlot("13h", "day"),
  ],
};

export async function getSchedule(): Promise<WeeklyScheduleConfig> {
  try {
    const stored = await redis.get<WeeklyScheduleConfig>(KV_KEY);
    return stored ?? DEFAULT_SCHEDULE;
  } catch (error) {
    console.error("Erreur lecture planning Redis:", error);
    return DEFAULT_SCHEDULE;
  }
}

export async function getSpecialEvents(): Promise<SpecialEvent[]> {
  try {
    const stored = await redis.get<SpecialEvent[]>(SPECIAL_EVENTS_KEY);
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Erreur lecture événements ponctuels Redis:", error);
    return [];
  }
}

export async function saveSpecialEvents(events: SpecialEvent[]): Promise<void> {
  await redis.set(SPECIAL_EVENTS_KEY, events);
}