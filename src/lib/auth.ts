import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            roles: {
              where: { revokedAt: null },
            },
          },
        });

        if (!user?.passwordHash || user.deletedAt) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (!token.sub) {
        return token;
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          roles: {
            where: { revokedAt: null },
            orderBy: { assignedAt: "asc" },
          },
        },
      });

      if (!currentUser || currentUser.deletedAt) {
        return token;
      }

      const roles = currentUser.roles.map(({ role }) => role);
      const primaryRole = currentUser.roles.find(({ isPrimary }) => isPrimary)?.role ?? null;

      token.roles = roles;
      token.primaryRole = primaryRole;
      token.onboardingComplete = Boolean(
        currentUser.name && currentUser.surname && currentUser.schoolId && primaryRole,
      );

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roles = token.roles ?? [];
        session.user.primaryRole = token.primaryRole ?? null;
        session.user.onboardingComplete = token.onboardingComplete ?? false;
      }

      return session;
    },
  },
};
