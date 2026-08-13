import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Registrati | Leonessa",
};

export default function RegisterPage() {
  return (
    <AuthCard
      eyebrow="Entra nella community"
      title="Crea il tuo account"
      description="Registrati in pochi secondi. Potrai completare scuola e ruolo al primo accesso."
    >
      <RegisterForm />
    </AuthCard>
  );
}
