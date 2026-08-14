import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Accedi | Leonessa",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard title="Accedi">
      <LoginForm callbackUrl={params.callbackUrl ?? "/"} />
    </AuthCard>
  );
}
