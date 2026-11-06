import { NextResponse } from "next/server";
import { APP_VERSION, APP_VERSION_TAG, APP_VERSION_DISPLAY } from "@/config/version";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    success: true,
    version: APP_VERSION,
    tag: APP_VERSION_TAG,
    display: APP_VERSION_DISPLAY,
    timestamp: Date.now(),
  });
}
