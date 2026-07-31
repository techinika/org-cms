import { NextRequest, NextResponse } from "next/server";

const UPLOADS_WORKER_URL = (
  process.env.NEXT_PUBLIC_UPLOADS_WORKER_URL || "http://localhost:8790"
).replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    formData.set("record", "true");

    const res = await fetch(`${UPLOADS_WORKER_URL}/api/upload`, {
      method: "POST",
      headers: {
        "X-API-Key": process.env.WORKER_API_KEY || "",
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || `Upload failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      url: data.url,
      asset_id: data.asset_id,
      name: data.name,
    });
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
