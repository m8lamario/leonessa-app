import type { FantasyPlayer } from "../types";

export const PRICE_FILTERS = [
  { id: "all", label: "Tutti", min: 0, max: Number.POSITIVE_INFINITY },
  { id: "0-10", label: "0–10 LP", min: 0, max: 10 },
  { id: "10-20", label: "10–20 LP", min: 11, max: 20 },
  { id: "20-50", label: "20–50 LP", min: 21, max: 50 },
  { id: "50+", label: "50+ LP", min: 51, max: Number.POSITIVE_INFINITY },
] as const;

export const SORT_OPTIONS = [
  { id: "price-asc", label: "Prezzo crescente" },
  { id: "price-desc", label: "Prezzo decrescente" },
  { id: "points", label: "Punti" },
  { id: "name", label: "Nome" },
] as const;

export type PriceFilterId = (typeof PRICE_FILTERS)[number]["id"];
export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export type BuilderPlayerFilters = {
  search: string;
  priceFilter: PriceFilterId;
  schoolFilter: string;
  sort: SortId;
};

function matchesPrice(value: number, filterId: PriceFilterId) {
  const band = PRICE_FILTERS.find((item) => item.id === filterId) ?? PRICE_FILTERS[0];
  return value >= band.min && value <= band.max;
}

export function filterBuilderPlayers(players: FantasyPlayer[], filters: BuilderPlayerFilters) {
  const query = filters.search.trim().toLowerCase();
  const filtered = players.filter((player) => {
    if (query && !`${player.name} ${player.school}`.toLowerCase().includes(query)) {
      return false;
    }
    if (!matchesPrice(player.fantasyValue, filters.priceFilter)) return false;
    if (filters.schoolFilter !== "all" && player.school !== filters.schoolFilter) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === "price-desc") return b.fantasyValue - a.fantasyValue;
    if (filters.sort === "points") return (b.totalPoints ?? -1) - (a.totalPoints ?? -1);
    if (filters.sort === "name") return a.name.localeCompare(b.name, "it");
    return a.fantasyValue - b.fantasyValue;
  });
}
