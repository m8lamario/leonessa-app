import type { Metadata } from "next";

import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Leonessa",
  description: "La piattaforma ufficiale della Leonessa Cup.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <svg
          className="pattern"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lineGlow">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M0 0 L500 500" />
          <path d="M1000 0 L500 500" />
          <path d="M0 300 L500 800" />
          <path d="M1000 300 L500 800" />
          <path d="M0 600 L500 1100" />
          <path d="M1000 600 L500 1100" />
          <path className="patternGlow" d="M0 0 L500 500" />
          <path className="patternGlow" d="M1000 0 L500 500" />
          <path className="patternGlow" d="M0 300 L500 800" />
          <path className="patternGlow" d="M1000 300 L500 800" />
          <path className="patternGlow" d="M0 600 L500 1100" />
          <path className="patternGlow" d="M1000 600 L500 1100" />
        </svg>
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
