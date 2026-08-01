import { NextRequest, NextResponse } from "next/server";

const AI_WORKER_URL = (
  process.env.NEXT_PUBLIC_AI_WORKER_URL || "http://localhost:8788"
).replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${AI_WORKER_URL}/api/ai/compare`, {
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
        { error: data.error || `AI compare failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI compare proxy error:", error);
    return NextResponse.json({ error: "Failed to run AI compare" }, { status: 500 });
  }
}
