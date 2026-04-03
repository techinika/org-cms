import { AuthUser } from "@/types/company";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${AUTH_URL}/api/auth/status`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error("Failed to fetch auth status:", error);
    return null;
  }
}

export function getAuthUrl(): string {
  return `${process.env.NEXT_PUBLIC_AUTH_URL}/status`;
}