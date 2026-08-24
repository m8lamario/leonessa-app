import { ChartNoAxesColumn, House, LayoutGrid, Volleyball, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export type BottomNavigationItemConfig = {
  id: "home" | "fanta" | "ranking" | "altro";
  label: string;
  href: Route;
  icon: LucideIcon;
  activePath?: string;
  matchPrefix?: boolean;
  badge?: number;
};

export const bottomNavigationItems: BottomNavigationItemConfig[] = [
  {
    id: "home",
    label: "Home",
    href: "/dashboard",
    icon: House,
    activePath: "/dashboard",
  },
  {
    id: "fanta",
    label: "Fanta",
    href: "/fanta" as Route,
    icon: Volleyball,
    activePath: "/fanta",
    matchPrefix: true,
  },
  {
    id: "ranking",
    label: "Ranking",
    href: "/ranking",
    icon: ChartNoAxesColumn,
    activePath: "/ranking",
  },
  {
    id: "altro",
    label: "Altro",
    href: "/altro" as Route,
    icon: LayoutGrid,
    activePath: "/altro",
    matchPrefix: true,
  },
];

export function isBottomNavItemActive(
  pathname: string,
  item: Pick<BottomNavigationItemConfig, "activePath" | "href" | "matchPrefix">,
) {
  const path = item.activePath ?? item.href;
  if (pathname === path) return true;
  return Boolean(item.matchPrefix && pathname.startsWith(`${path}/`));
}
