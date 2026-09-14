import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel interno — Poly Dantas",
  description: "CRM interno da campanha de Poly Dantas",
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
