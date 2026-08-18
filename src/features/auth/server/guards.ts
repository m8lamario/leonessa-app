import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApplicationRole } from "@/types/auth";
import { AppError } from "@/utils/errors";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Autenticazione richiesta.", 401);
  }

  return session;
}

export async function requireUser() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      deletedAt: true,
      email: true,
      emailVerified: true,
      instagram: true,
      name: true,
      surname: true,
      schoolId: true,
      roles: {
        where: { revokedAt: null },
        select: { role: true, isPrimary: true },
      },
      school: {
        select: { id: true, name: true, shortName: true, logoUrl: true },
      },
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError("UNAUTHORIZED", "Utente non disponibile.", 401);
  }

  return user;
}

export async function requireRole(role: ApplicationRole) {
  const user = await requireUser();
  const hasRole = user.roles.some((userRole) => userRole.role === role);

  if (!hasRole) {
    throw new AppError("FORBIDDEN", "Permessi insufficienti.", 403);
  }

  return user;
}

export async function requireAnyRole(roles: ApplicationRole[]) {
  const user = await requireUser();
  const hasRole = user.roles.some((userRole) => roles.includes(userRole.role));

  if (!hasRole) {
    throw new AppError("FORBIDDEN", "Permessi insufficienti.", 403);
  }

  return user;
}

export function isOnboardingComplete(user: {
  name: string | null;
  surname: string | null;
  schoolId: string | null;
  roles: Array<{ role: ApplicationRole; isPrimary: boolean }>;
}) {
  return Boolean(
    user.name && user.surname && user.schoolId && user.roles.some(({ isPrimary }) => isPrimary),
  );
}
