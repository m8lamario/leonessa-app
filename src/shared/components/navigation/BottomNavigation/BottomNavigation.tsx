"use client";

import { usePathname } from "next/navigation";

import { BottomNavigationItem } from "./BottomNavigationItem";
import { bottomNavigationItems, isBottomNavItemActive } from "./navigation.config";
import styles from "./BottomNavigation.module.css";

export function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === "/fanta/team" || pathname.startsWith("/fanta/team/")) {
    return null;
  }

  return (
    <nav className={styles.navigation} aria-label="Navigazione principale">
      {bottomNavigationItems.map((item) => (
        <BottomNavigationItem
          isActive={isBottomNavItemActive(pathname, item)}
          item={item}
          key={item.id}
        />
      ))}
    </nav>
  );
}
