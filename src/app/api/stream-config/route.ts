import { NextRequest, NextResponse } from "next/server";
import {
  getActiveStreamSource,
  setActiveStreamSource,
  STREAM_URLS,
  type StreamSource,
} from "@/lib/streamConfig";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function GET() {
  try {
    const source = await getActiveStreamSource();
    return NextResponse.json({ source, url: STREAM_URLS[source] });
  } catch (error) {
    console.error("stream-config GET error:", error);
    return NextResponse.json({ source: "main", url: STREAM_URLS.main });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const source = body.source as StreamSource;
    if (source !== "main" && source !== "backup") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await setActiveStreamSource(source);
    return NextResponse.json({ ok: true, source, url: STREAM_URLS[source] });
  } catch (error) {
    console.error("stream-config POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
