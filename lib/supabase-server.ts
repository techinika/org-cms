import { createBrowserClient } from "@supabase/ssr";

export function createServerClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_PROJECT_URL!,
    process.env.NEXT_PUBLIC_API_KEY!
  );
}

export function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_PROJECT_URL!,
    process.env.NEXT_PUBLIC_SERVICE_KEY!
  );
}