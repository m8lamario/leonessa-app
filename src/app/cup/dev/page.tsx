import type { Metadata } from "next";

import { CupDevPage } from "@/features/cup";

export const metadata: Metadata = {
  title: "Cup data layer | Leonessa",
  description: "Pagina tecnica temporanea per il layer dati della Leonessa Cup.",
};

export default function CupDevRoute() {
  return <CupDevPage />;
}
