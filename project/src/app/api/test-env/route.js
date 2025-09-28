import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    userId: process.env.NEXT_PUBLIC_SOUNDCLOUD_USER_ID,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  });
}
