import type { Metadata } from "next";

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
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
