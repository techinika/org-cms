"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AuthUser } from "@/types/company";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";

interface AuthState {
  user: AuthUser | null;
  profilePicture: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth(requireAuth = true): AuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    user: null,
    profilePicture: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });
  const mountedRef = useRef(true);

  const fetchAuth = useCallback(async () => {
    try {
      const result = await checkAuthClient();
      if (!mountedRef.current) return;

      if (!result.authenticated || !result.user) {
        if (requireAuth) {
          window.location.replace(getAuthRedirectUrl());
          return;
        }
        setState({ user: null, profilePicture: null, isLoading: false, isAuthenticated: false, isAdmin: false });
        return;
      }

      setState({
        user: result.user,
        profilePicture: result.profilePicture,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: result.isAdmin || false,
      });
    } catch {
      if (!mountedRef.current) return;
      if (requireAuth) {
        window.location.replace(getAuthRedirectUrl());
      } else {
        setState({ user: null, profilePicture: null, isLoading: false, isAuthenticated: false, isAdmin: false });
      }
    }
  }, [requireAuth]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAuth();
    return () => { mountedRef.current = false; };
  }, [fetchAuth]);

  return { ...state, refresh: fetchAuth };
}
