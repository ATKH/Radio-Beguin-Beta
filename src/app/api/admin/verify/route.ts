import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Vérifie simplement le mot de passe admin (utilisé par l'écran de connexion de /admin).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = body?.password;

  // ⚠️ Utilise la même variable que tes routes /api/events, /api/news, etc.
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "Mot de passe admin non configuré sur le serveur" },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}