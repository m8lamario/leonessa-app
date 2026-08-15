import { ChartNoAxesColumn, House, Trophy, User, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export type BottomNavigationItemConfig = {
  id: "home" | "cup" | "ranking" | "profile";
  label: string;
  href: Route;
  icon: LucideIcon;
  activePath?: string;
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
    id: "cup",
    label: "Cup",
    href: "/dashboard#featured-match",
    icon: Trophy,
  },
  {
    id: "ranking",
    label: "Ranking",
    href: "/ranking",
    icon: ChartNoAxesColumn,
    activePath: "/ranking",
  },
  {
    id: "profile",
    label: "Profilo",
    href: "/profile",
    icon: User,
    activePath: "/profile",
  },
];
