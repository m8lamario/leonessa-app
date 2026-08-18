"use client";

import { usePathname } from "next/navigation";

import { BottomNavigationItem } from "./BottomNavigationItem";
import { bottomNavigationItems } from "./navigation.config";
import styles from "./BottomNavigation.module.css";

export function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === "/fanta/team" || pathname.startsWith("/fanta/team/")) {
    return null;
  }

  return (
    <nav className={styles.navigation} aria-label="Navigazione principale">
      {bottomNavigationItems.map((item) => (
        <BottomNavigationItem isActive={item.activePath === pathname} item={item} key={item.id} />
      ))}
    </nav>
  );
}
