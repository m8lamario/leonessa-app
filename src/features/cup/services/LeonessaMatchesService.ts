import "server-only";

import { getMockMatches, isEslMatchPayload, mapEslMatches } from "../utils";
import type { Match } from "../types";

export const ESL_MATCHES_API_URL = "https://api.estudentsleague.com/matches/?format=json";

export type GetMatchesOptions = {
  useFallback?: boolean;
};

export class LeonessaMatchesService {
  constructor(private readonly apiUrl = ESL_MATCHES_API_URL) {}

  async getMatches({ useFallback = true }: GetMatchesOptions = {}): Promise<Match[]> {
    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`ESL matches request failed with status ${response.status}`);
      }

      const payload: unknown = await response.json();

      if (!isEslMatchPayload(payload)) {
        throw new Error("ESL matches response has an unsupported shape");
      }

      return mapEslMatches(payload);
    } catch (error) {
      if (!useFallback) {
        throw error;
      }

      console.warn("ESL matches unavailable; using Leonessa Cup mock data.", error);
      return getMockMatches();
    }
  }
}

export const leonessaMatchesService = new LeonessaMatchesService();
