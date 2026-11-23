import { connection, NextResponse } from "next/server";

export async function GET() {
  await connection();
  return NextResponse.json({
    service: "orbit-workspace",
    status: "operational",
    syncEngine: "broadcast-channel-v1",
    timestamp: new Date().toISOString(),
  });
}
