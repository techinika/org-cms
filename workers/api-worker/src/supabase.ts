import { Env } from "./env";

export function jsonResp(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export function supabaseHeaders(env: Env) {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    Prefer: "return=representation",
  };
}

export async function supabaseGet(env: Env, table: string, query = "") {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  });
}

export async function supabaseInsert(env: Env, table: string, body: unknown) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: supabaseHeaders(env),
    body: JSON.stringify(body),
  });
}

export async function supabaseUpdate(env: Env, table: string, filter: string, body: unknown) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: supabaseHeaders(env),
    body: JSON.stringify(body),
  });
}

export async function supabaseDelete(env: Env, table: string, filter: string) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  });
}

export async function supabaseCount(env: Env, table: string, filter: string): Promise<number> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "HEAD",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      Range: "0-0",
      Prefer: "count=exact",
    },
  });
  return parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10);
}
