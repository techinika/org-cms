"use client";

import { AuthUser } from "@/types/company";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;

export async function checkAuthClient(): Promise<{
  authenticated: boolean;
  user: AuthUser | null;
  isAdmin: boolean;
}> {
  try {
    const response = await fetch(`${AUTH_URL}/api/auth/status`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return { authenticated: false, user: null, isAdmin: false };
    }

    const data = await response.json();
    return {
      authenticated: data.authenticated || false,
      user: data.user || null,
      isAdmin: data.isAdmin || false,
    };
  } catch (error) {
    console.error("Auth check failed:", error);
    return { authenticated: false, user: null, isAdmin: false };
  }
}

export function getAuthRedirectUrl(path: string = "/"): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  return `${AUTH_URL}/status?redirect=${encodeURIComponent(baseUrl)}${path}`;
}