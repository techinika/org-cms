import { Env } from "./env";
import { handleCompareApplicants } from "./routes/compare";

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
      if (url.pathname === "/api/ai/compare" && request.method === "POST") {
        return await handleCompareApplicants(request, env, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (err) {
      console.error("AI worker error:", err);
      return json({ error: "Internal server error" }, 500, origin);
    }
  },
};
