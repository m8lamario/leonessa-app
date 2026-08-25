import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registrati | Leonessa",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const query = await searchParams;
  const referralCode = typeof query.ref === "string" ? query.ref : "";
  const schools = await prisma.school.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, logoUrl: true },
  });

  return (
    <AuthCard title="Registrati">
      <RegisterForm initialReferralCode={referralCode} schools={schools} />
    </AuthCard>
  );
}
