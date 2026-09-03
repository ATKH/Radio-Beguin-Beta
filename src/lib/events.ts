import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const EVENTS_KEY = "radio-beguin:events";

export type EventLink = {
  label: string;
  url: string;
};

export type RadioEvent = {
  id: string;
  slug: string;
  title: string;
  date: string; // format "YYYY-MM-DD"
  time?: string; // ex: "20h"
  shortDescription: string;
  fullDescription: string;
  image: string; // URL
  links: EventLink[];
};

export async function getAllEvents(): Promise<RadioEvent[]> {
  try {
    const stored = await redis.get<RadioEvent[]>(EVENTS_KEY);
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Erreur lecture événements Redis:", error);
    return [];
  }
}

// Ne renvoie que les événements dont la date n'est pas encore passée, triés par date croissante
export async function getUpcomingEvents(): Promise<RadioEvent[]> {
  const all = await getAllEvents();
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return all
    .filter((event) => event.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getEventBySlug(slug: string): Promise<RadioEvent | null> {
  const all = await getAllEvents();
  return all.find((event) => event.slug === slug) ?? null;
}

export async function saveAllEvents(events: RadioEvent[]): Promise<void> {
  await redis.set(EVENTS_KEY, events);
}