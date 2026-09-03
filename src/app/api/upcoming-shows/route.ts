import { NextRequest, NextResponse } from "next/server";
import { getAllUpcomingShows, saveUpcomingShows } from "@/lib/upcomingShows";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function GET() {
  try {
    const shows = await getAllUpcomingShows();
    return NextResponse.json({ shows });
  } catch (error) {
    console.error("upcoming-shows GET error:", error);
    return NextResponse.json({ shows: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!Array.isArray(body.shows)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await saveUpcomingShows(body.shows);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("upcoming-shows POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
