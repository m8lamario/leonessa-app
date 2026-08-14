import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { Skeleton } from "./Skeleton";

type SkeletonAvatarProps = Omit<
  ComponentPropsWithoutRef<typeof Skeleton>,
  "height" | "variant" | "width"
> & {
  size?: CSSProperties["width"];
};

export function SkeletonAvatar({ size = "2.75rem", ...props }: SkeletonAvatarProps) {
  return <Skeleton height={size} variant="avatar" width={size} {...props} />;
}
