import type { LucideProps } from "lucide-react";
import {
  Award,
  BadgeCheck,
  BrickWall,
  Circle,
  CircleDot,
  Crown,
  Flag,
  Flame,
  Footprints,
  Gem,
  Goal,
  Medal,
  Megaphone,
  Sparkles,
  Square,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

export const FANTA_ICONS = {
  award: Award,
  "badge-check": BadgeCheck,
  "brick-wall": BrickWall,
  circle: Circle,
  "circle-dot": CircleDot,
  crown: Crown,
  flag: Flag,
  flame: Flame,
  footprints: Footprints,
  gem: Gem,
  goal: Goal,
  medal: Medal,
  megaphone: Megaphone,
  sparkles: Sparkles,
  square: Square,
  star: Star,
  target: Target,
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  trophy: Trophy,
} as const;

export type FantaIconName = keyof typeof FANTA_ICONS;

type FantaIconProps = LucideProps & {
  name: FantaIconName | string;
};

export function FantaIcon({ name, size = 16, ...props }: FantaIconProps) {
  const Icon = FANTA_ICONS[name as FantaIconName] ?? Megaphone;
  return <Icon aria-hidden="true" size={size} {...props} />;
}
