import { cookies } from "next/headers";
import { AuthUser } from "@/types/company";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "";

export type ServerAuthResult = {
  authenticated: boolean;
  user: AuthUser | null;
  isAdmin: boolean;
  role: string | null;
  error?: string;
};

export const checkAuthStatusServer = async (): Promise<ServerAuthResult> => {
  if (!AUTH_URL) {
    console.error("[checkAuthStatusServer] Auth URL not configured");
    return { authenticated: false, user: null, isAdmin: false, role: null, error: "Auth URL not configured" };
  }

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${AUTH_URL}/api/auth/status`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        Authorization: `Bearer ${cookieStore.get("sb-access-token")?.value || ""}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Auth check failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      authenticated: data.authenticated || false,
      user: data.user || null,
      isAdmin: data.isAdmin || false,
      role: data.role || null,
    };
  } catch (error) {
    return {
      authenticated: false,
      user: null,
      isAdmin: false,
      role: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const requireAuthenticated = (auth: ServerAuthResult): boolean => {
  return !!auth.authenticated;
};
