import { NextRequest, NextResponse } from "next/server";
import { fetchPlayerProfile } from "@/lib/clash-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;

  if (!tag) {
    return NextResponse.json(
      { success: false, error: "Player tag is required" },
      { status: 400 }
    );
  }

  const result = await fetchPlayerProfile(tag);
  return NextResponse.json(result, {
    status: result.success ? 200 : result.isKeyMissing ? 200 : 400,
  });
}
