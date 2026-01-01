"use client";

import { api } from "@midori/lib/api";
import type { Role } from "@midori/lib/roles";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook for fetching and managing the current user session
 * Uses the /api/user/me endpoint to get user data including role
 */
export function useSession() {
  const { data, isLoading, error, refetch } = api.useQuery(
    "get",
    "/api/user/me",
    {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );

  const user = data;
  const role = user?.role as Role | undefined;
  const isAuthenticated = !!user && !error;

  return {
    user,
    role,
    isLoading,
    isAuthenticated,
    error,
    refetch,
  };
}

export function useClearSession() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: ["get", "/api/user/me"] });
  };
}
