// app/api/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const KV_KEY = "radio-beguin:schedule";

export async function GET() {
  try {
    const data = await kv.get(KV_KEY);
    if (!data) {
      return NextResponse.json({ schedule: null });
    }
    return NextResponse.json({ schedule: data });
  } catch (error) {
    console.error("KV GET error:", error);
    return NextResponse.json({ schedule: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Vérification mot de passe
    if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!body.schedule || typeof body.schedule !== "object") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await kv.set(KV_KEY, body.schedule);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("KV POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
