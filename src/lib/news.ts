import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const KV_KEY = "radio-beguin:news";

export type NewsItem = {
  id: string;
  title: string;
  titleEn?: string;
  text: string;
  textEn?: string;
  image?: string;
  link?: string;
  linkLabel?: string;
  linkLabelEn?: string;
};

export async function getAllNews(): Promise<NewsItem[]> {
  try {
    const stored = await redis.get<NewsItem[]>(KV_KEY);
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Erreur lecture news Redis:", error);
    return [];
  }
}

export async function saveNews(news: NewsItem[]): Promise<void> {
  await redis.set(KV_KEY, news);
}