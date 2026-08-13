import type { DefaultSession } from "next-auth";
import type { ApplicationRole } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: ApplicationRole[];
      primaryRole: ApplicationRole | null;
      onboardingComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles?: ApplicationRole[];
    primaryRole?: ApplicationRole | null;
    onboardingComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: ApplicationRole[];
    primaryRole?: ApplicationRole | null;
    onboardingComplete?: boolean;
  }
}
