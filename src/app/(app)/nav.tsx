"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "./actions";
import { MODULE_LABELS, MODULE_PATHS } from "@/lib/permissions";
import type { Module } from "@/lib/types";

const ICONS: Record<Module, string> = {
  agenda: "📅",
  engajamento: "✅",
  ideias: "💡",
  admin: "⚙️",
};

export default function Nav({
  memberName,
  modules,
}: {
  memberName: string;
  modules: Module[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = modules.map((m) => (
    <Link
      key={m}
      href={MODULE_PATHS[m]}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        pathname === MODULE_PATHS[m]
          ? "bg-violet-100 text-violet-800"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span>{ICONS[m]}</span>
      {MODULE_LABELS[m]}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-violet-900">Poly Dantas</span>
          <span className="hidden sm:inline text-xs text-slate-400">· painel interno</span>
        </div>
        <button
          className="sm:hidden text-slate-600"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          ☰
        </button>
        <nav className="hidden sm:flex items-center gap-1">
          {links}
          <span className="mx-2 text-sm text-slate-400">{memberName}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Sair
            </button>
          </form>
        </nav>
      </div>
      {open && (
        <nav className="sm:hidden border-t border-slate-100 px-4 py-3 flex flex-col gap-1">
          {links}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-sm text-slate-400">{memberName}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Sair
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
