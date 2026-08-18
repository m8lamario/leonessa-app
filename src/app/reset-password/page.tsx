import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { PasswordResetForm } from "@/features/auth/components/password-recovery-forms";

export const metadata: Metadata = {
  title: "Nuova password | Leonessa",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthCard title="Nuova password">
      <PasswordResetForm token={token} />
    </AuthCard>
  );
}
