import { Env } from "./env";
import { handleUploadImage } from "./routes/upload-image";
import { routeEvents } from "./routes/events";
import { routeOpportunities } from "./routes/opportunities";
import { routeCompanies } from "./routes/companies";
import { routeAssets } from "./routes/assets";

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://orgcms.techinika.com",
  ];
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (url.pathname === "/api/upload-image" && request.method === "POST") {
        return await handleUploadImage(request, env, origin);
      }

      // Events routes
      const eventResponse = await routeEvents(request, env, url, origin);
      if (eventResponse) return eventResponse;

      // Opportunities routes
      const oppResponse = await routeOpportunities(request, env, url, origin);
      if (oppResponse) return oppResponse;

      // Companies routes
      const compResponse = await routeCompanies(request, env, url, origin);
      if (compResponse) return compResponse;

      // Assets routes
      const assetResponse = routeAssets(request, env, url, origin);
      if (assetResponse) return assetResponse;

      return json({ error: "Not found" }, 404, origin);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal server error" }, 500, origin);
    }
  },
};
