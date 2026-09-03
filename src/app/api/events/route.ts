import { NextRequest, NextResponse } from "next/server";
import { getAllEvents, saveAllEvents } from "@/lib/events";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function GET() {
  try {
    const events = await getAllEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("events GET error:", error);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!Array.isArray(body.events)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await saveAllEvents(body.events);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("events POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}