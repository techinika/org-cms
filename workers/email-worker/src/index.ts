import { Env } from "./env";
import { handleSendEmail } from "./routes/send-email";
import { handleSubscriptionCheck } from "./routes/subscription-check";

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    "https://org.techinika.com",
  ];
  const allowOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

function json(
  data: unknown,
  status = 200,
  origin: string | null = null,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (url.pathname === "/api/send-email" && request.method === "POST") {
        return await handleSendEmail(request, env, origin);
      }

      if (
        url.pathname === "/api/subscription-check" &&
        request.method === "GET"
      ) {
        return await handleSubscriptionCheck(request, env, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (err) {
      console.error("Email worker error:", err);
      return json({ error: "Internal server error" }, 500, origin);
    }
  },
};
