import { NextResponse } from "next/server";

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID!;
const REDIRECT_URI = process.env.SOUNDCLOUD_REDIRECT_URI!;

export async function GET() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: "",
    display: "popup",
  });

  return NextResponse.redirect(`https://soundcloud.com/connect?${params.toString()}`);
}
