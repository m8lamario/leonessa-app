import { ChartNoAxesColumn, House, User, Volleyball, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export type BottomNavigationItemConfig = {
  id: "home" | "fanta" | "ranking" | "profile";
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
    id: "fanta",
    label: "Fanta",
    href: "/fanta" as Route,
    icon: Volleyball,
    activePath: "/fanta",
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
