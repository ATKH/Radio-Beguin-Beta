// src/app/api/sc-debug-token/route.ts
export const runtime = "nodejs";

export async function GET() {
  const token = process.env.SOUNDCLOUD_ACCESS_TOKEN || "";
  const prefix = token ? token.slice(0, 40) : "undefined";

  return new Response(
    JSON.stringify({
      defined: Boolean(token),
      prefix,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
