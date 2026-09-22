"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import { MODULE_LABELS, MODULE_PATHS } from "@/lib/permissions";
import type { Module } from "@/lib/types";

const ICONS: Record<Module, string> = {
  agenda: "📅",
  engajamento: "✅",
  ideias: "💡",
  aprovacao: "🖼️",
  admin: "⚙️",
};

const SHORT_LABELS: Record<Module, string> = {
  agenda: "Agenda",
  engajamento: "Engaj.",
  ideias: "Ideias",
  aprovacao: "Posts",
  admin: "Admin",
};

export default function Nav({
  memberName,
  modules,
}: {
  memberName: string;
  modules: Module[];
}) {
  const pathname = usePathname();
  const firstName = memberName.split(" ")[0];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex sm:flex-col sm:fixed sm:inset-y-0 sm:left-0 sm:w-20 lg:w-60 bg-brand-900 text-white z-20">
        <div className="flex items-center gap-2.5 px-4 h-16 shrink-0">
          <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-cyan-accent text-sm shrink-0">
            PD
          </span>
          <div className="hidden lg:block leading-tight">
            <p className="font-semibold text-sm">Poly Dantas</p>
            <p className="text-[11px] text-white/50">painel interno</p>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-2 space-y-1">
          {modules.map((m) => {
            const active = pathname === MODULE_PATHS[m];
            return (
              <Link
                key={m}
                href={MODULE_PATHS[m]}
                className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-600 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base shrink-0">{ICONS[m]}</span>
                <span className="hidden lg:inline leading-tight">{MODULE_LABELS[m]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-white/10">
          <div className="hidden lg:block px-3 py-2 text-xs text-white/50 truncate">
            {memberName}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base shrink-0">🚪</span>
              <span className="hidden lg:inline">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sm:hidden sticky top-0 z-20 bg-brand-900 text-white">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-cyan-accent text-xs">
              PD
            </span>
            <span className="font-semibold text-sm">Olá, {firstName}</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-white/70 hover:text-white active:text-white transition"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação principal"
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${modules.length}, minmax(0, 1fr))` }}
        >
          {modules.map((m) => {
            const active = pathname === MODULE_PATHS[m];
            return (
              <Link
                key={m}
                href={MODULE_PATHS[m]}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-brand-700" : "text-slate-400"
                }`}
              >
                <span className={`text-lg leading-none transition ${active ? "scale-110" : ""}`}>
                  {ICONS[m]}
                </span>
                {SHORT_LABELS[m]}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
