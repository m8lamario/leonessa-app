import { BottomNavigation, ScreenLayout } from "@/shared/components";

export default function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ScreenLayout>
      {children}
      <BottomNavigation />
    </ScreenLayout>
  );
}
