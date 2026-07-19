import { Env } from "../env";
import { verifyAuth } from "../auth";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateKey(folder: string, fileName: string): string {
  const ext = fileName.split(".").pop() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${folder}/${timestamp}-${random}.${ext}`;
}

export async function handleUploadImage(
  request: Request,
  env: Env,
  origin: string | null
): Promise<Response> {
  const jsonResp = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });

  try {
    if (!(await verifyAuth(request, env))) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";
    const authorId = formData.get("authorId") as string | null;

    if (!file) {
      return jsonResp({ error: "No file provided" }, 400);
    }

    const key = generateKey(folder, file.name || "upload");

    await env.UPLOADS.put(key, file, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000",
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name || "upload",
        authorId: authorId || "",
      },
    });

    const publicUrl = `${new URL(request.url).origin}/r2/${key}`;

    const supabaseRes = await fetch(`${env.SUPABASE_URL}/rest/v1/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": env.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        name: file.name || "upload",
        url: publicUrl,
        type: file.type?.startsWith("image")
          ? "image"
          : file.type?.startsWith("video")
          ? "video"
          : "doc",
        views: 0,
        author_id: authorId || null,
      }),
    });

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      console.error("Supabase asset insert failed:", errText);
      return jsonResp({ error: "Failed to create asset record" }, 500);
    }

    const asset = (await supabaseRes.json()) as Array<{
      id: string;
      url: string;
      name: string;
    }>;

    return jsonResp({
      url: publicUrl,
      asset_id: asset[0]?.id,
      name: file.name || "upload",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return jsonResp({ error: "Internal server error" }, 500);
  }
}
