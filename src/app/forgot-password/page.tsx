import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { PasswordRecoveryRequestForm } from "@/features/auth/components/password-recovery-forms";

export const metadata: Metadata = {
  title: "Recupera password | Leonessa",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Recupera password">
      <PasswordRecoveryRequestForm />
    </AuthCard>
  );
}
