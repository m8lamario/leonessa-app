import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import styles from "./PageContainer.module.css";

type PageContainerProps<T extends ElementType = "main"> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export function PageContainer<T extends ElementType = "main">({
  as,
  children,
  className,
  ...props
}: PageContainerProps<T>) {
  const Component = as ?? "main";

  return (
    <Component className={[styles.container, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}
