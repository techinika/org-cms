import { Env } from "./env";

export function supabaseHeaders(env: Env) {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  };
}

export async function supabaseGet(env: Env, table: string, query = "") {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  });
}

export async function supabaseUpdate(env: Env, table: string, filter: string, body: unknown) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: supabaseHeaders(env),
    body: JSON.stringify(body),
  });
}
