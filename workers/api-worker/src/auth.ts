import { Env } from "./env";

export async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey && apiKey === env.WORKER_API_KEY) return true;

  const cookieHeader = request.headers.get("Cookie") || "";
  const authHeader = request.headers.get("Authorization") || "";
  try {
    const res = await fetch(`${env.AUTH_URL}/api/auth/status`, {
      method: "GET",
      headers: { Cookie: cookieHeader, Authorization: authHeader },
    });
    if (res.ok) {
      const data = await res.json() as { authenticated?: boolean };
      return data.authenticated === true;
    }
  } catch {}
  return false;
}
