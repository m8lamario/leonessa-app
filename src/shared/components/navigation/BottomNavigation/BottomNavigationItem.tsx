import Link from "next/link";

import { selection as hapticSelection } from "@/shared/lib/haptics";

import type { BottomNavigationItemConfig } from "./navigation.config";
import styles from "./BottomNavigation.module.css";

type BottomNavigationItemProps = {
  item: BottomNavigationItemConfig;
  isActive: boolean;
};

export function BottomNavigationItem({ item, isActive }: BottomNavigationItemProps) {
  const Icon = item.icon;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={isActive ? styles.activeItem : styles.item}
      href={item.href}
      onClick={() => {
        if (!isActive) {
          void hapticSelection();
        }
      }}
    >
      <span className={styles.icon}>
        <Icon aria-hidden="true" size={22} strokeWidth={2} />
        {item.badge !== undefined && <span className={styles.badge}>{item.badge}</span>}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}
