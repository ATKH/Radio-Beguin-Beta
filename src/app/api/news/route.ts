import { NextRequest, NextResponse } from "next/server";
import { getAllNews, saveNews, type NewsItem } from "@/lib/news";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function GET() {
  try {
    const news = await getAllNews();
    return NextResponse.json({ news });
  } catch (error) {
    console.error("news GET error:", error);
    return NextResponse.json({ news: [] });
  }
}

const isOptionalString = (value: any) => value === undefined || typeof value === "string";

function isValidNewsItem(item: any): item is NewsItem {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.text === "string" &&
    isOptionalString(item.titleEn) &&
    isOptionalString(item.textEn) &&
    isOptionalString(item.image) &&
    isOptionalString(item.link) &&
    isOptionalString(item.linkLabel) &&
    isOptionalString(item.linkLabelEn)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!Array.isArray(body.news) || !body.news.every(isValidNewsItem)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const cleaned: NewsItem[] = body.news
      .map((item: NewsItem) => ({
        id: item.id,
        title: item.title.trim(),
        titleEn: item.titleEn?.trim() || undefined,
        text: item.text.trim(),
        textEn: item.textEn?.trim() || undefined,
        image: item.image?.trim() || undefined,
        link: item.link?.trim() || undefined,
        linkLabel: item.linkLabel?.trim() || undefined,
        linkLabelEn: item.linkLabelEn?.trim() || undefined,
      }))
      .filter((item: NewsItem) => item.title || item.text);

    await saveNews(cleaned);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("news POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}