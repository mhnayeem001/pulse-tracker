import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "1.1.0",
    download_url: "https://pulse-tracker-theta.vercel.app/downloads/Pulse-Agent.zip",
    notes: "Real physical keyboard telemetry (VKey tracking) and automatic background updates.",
    mandatory: false,
    released_at: new Date().toISOString(),
  });
}
