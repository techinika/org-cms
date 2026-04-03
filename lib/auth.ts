import { cookies } from "next/headers";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  profilePicture?: string;
  isAdmin?: boolean;
  role?: string;
}

export interface AuthResult {
  authenticated: boolean;
  user: AuthUser | null;
  role: string | null;
  profilePicture: string | null;
  isAdmin: boolean;
  error?: string;
}

export const getAuthUrl = (): string => {
  return process.env.NEXT_PUBLIC_AUTH_URL || "";
};

export const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
};

export const checkAuthStatusServer = async (): Promise<AuthResult> => {
  const authUrl = getAuthUrl();
  
  if (!authUrl) {
    console.error("[checkAuthStatusServer] Auth URL not configured");
    return {
      authenticated: false,
      user: null,
      role: null,
      profilePicture: null,
      isAdmin: false,
      error: "Auth URL not configured",
    };
  }

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    
    const response = await fetch(`${authUrl}/api/auth/status`, {
      method: "GET",
      headers: {
        "cookie": cookieHeader,
        "Authorization": `Bearer ${cookieStore.get("sb-access-token")?.value || ""}`,
        "Accept": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Auth check failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      authenticated: data.authenticated || false,
      user: data.user || null,
      role: data.role || null,
      profilePicture: data.profilePicture || null,
      isAdmin: data.isAdmin || false,
    };
  } catch (error) {
    console.error("[checkAuthStatusServer] Error checking auth status:", error);
    return {
      authenticated: false,
      user: null,
      role: null,
      profilePicture: null,
      isAdmin: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export function getRedirectUrl(path: string = "/"): string {
  const authUrl = getAuthUrl();
  const baseUrl = getBaseUrl() || "http://localhost:3001";
  return `${authUrl}/status?redirect=${encodeURIComponent(baseUrl)}${path}`;
}