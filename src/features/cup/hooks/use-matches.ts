"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { cupApiService } from "../services";
import type { Match, Team } from "../types";

export const matchesQueryKey = ["cup", "matches"] as const;
export const teamsQueryKey = ["cup", "teams"] as const;

const matchesQueryOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
};

const matchesQueryBase = {
  ...matchesQueryOptions,
  queryKey: matchesQueryKey,
  queryFn: () => cupApiService.getMatches(),
};

const getUpcomingMatches = (matches: Match[]) =>
  matches
    .filter((match) => match.status === "scheduled" || match.status === "live")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

const getCompletedMatches = (matches: Match[]) =>
  matches
    .filter((match) => match.status === "completed")
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff));

export function useMatches(): UseQueryResult<Match[], Error> {
  return useQuery<Match[], Error>(matchesQueryBase);
}

export function useUpcomingMatches(): UseQueryResult<Match[], Error> {
  return useQuery<Match[], Error, Match[]>({
    ...matchesQueryBase,
    select: getUpcomingMatches,
  });
}

export function useCompletedMatches(): UseQueryResult<Match[], Error> {
  return useQuery<Match[], Error, Match[]>({
    ...matchesQueryBase,
    select: getCompletedMatches,
  });
}

export function useLeonessaTeams(): UseQueryResult<Team[], Error> {
  return useQuery<Team[], Error>({
    ...matchesQueryBase,
    queryKey: teamsQueryKey,
    queryFn: () => cupApiService.getTeams(),
  });
}
