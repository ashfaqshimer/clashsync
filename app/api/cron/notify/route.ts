import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { runNotificationSweep } from "@/lib/notify";

/**
 * Called by an Upstash QStash schedule (see scripts/setup-qstash-schedule.ts).
 * Only requests signed by QStash are accepted. In local development an
 * unsigned request is allowed so the sweep can be triggered by hand.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("upstash-signature");
  const isDev = process.env.NODE_ENV !== "production";

  if (signature) {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });
    let valid = false;
    try {
      valid = await receiver.verify({ signature, body });
    } catch {
      valid = false;
    }
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }
  } else if (!isDev) {
    return NextResponse.json({ success: false, error: "Missing signature" }, { status: 401 });
  }

  try {
    const summary = await runNotificationSweep();
    return NextResponse.json({ success: true, ...summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[notify] sweep failed:", message);
    // 500 makes QStash retry this run
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
