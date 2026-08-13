import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Registrati | Leonessa",
};

export default function RegisterPage() {
  return (
    <AuthCard title="Registrati">
      <RegisterForm />
    </AuthCard>
  );
}
