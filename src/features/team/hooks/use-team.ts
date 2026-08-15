"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";

import { teamApiService } from "../services";
import type { TeamPageData } from "../types";

export const teamQueryKey = (teamId: string) => ["team", teamId] as const;

export function useTeam(teamId: string): UseQueryResult<TeamPageData, Error> {
  return useQuery<TeamPageData, Error>({
    queryKey: teamQueryKey(teamId),
    queryFn: () => teamApiService.getTeam(teamId),
    enabled: Boolean(teamId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });
}

export function useTeamApplication(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kind: "player" | "staff") => teamApiService.apply(teamId, kind),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamQueryKey(teamId) });
    },
  });
}
