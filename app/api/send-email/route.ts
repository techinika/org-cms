import { NextRequest, NextResponse } from "next/server";
import { checkAuthStatusServer } from "@/lib/auth-server";

const COMMS_WORKER_URL = (
  process.env.NEXT_PUBLIC_COMMS_WORKER_URL || "http://localhost:8789"
).replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuthStatusServer();
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${COMMS_WORKER_URL}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || `Email send failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Send email proxy error:", error);
    return NextResponse.json({ error: "Failed to queue email" }, { status: 500 });
  }
}
