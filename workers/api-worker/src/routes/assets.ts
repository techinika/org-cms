import { Env } from "../env";
import { jsonResp, supabaseGet } from "../supabase";

export async function handleGetAssetById(env: Env, assetId: string, origin: string | null) {
  const res = await supabaseGet(env, "assets", `id=eq.${assetId}&limit=1`);
  if (!res.ok) return jsonResp({ error: await res.text() }, 400, origin);
  const data = await res.json() as Record<string, unknown>[];
  return jsonResp(data[0] || null, 200, origin);
}

export function routeAssets(request: Request, env: Env, url: URL, origin: string | null): Response | Promise<Response> | null {
  const method = request.method;
  const path = url.pathname;

  if (path.match(/^\/api\/assets\/[^/]+$/) && method === "GET") {
    const id = path.split("/")[3];
    return handleGetAssetById(env, id, origin);
  }

  return null;
}
