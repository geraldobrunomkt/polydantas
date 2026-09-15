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
  admin: "⚙️",
};

const SHORT_LABELS: Record<Module, string> = {
  agenda: "Agenda",
  engajamento: "Engaj.",
  ideias: "Ideias",
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

  return (
    <>
      {/* Top bar: desktop nav + always-visible identity/logout */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-violet-900">Poly Dantas</span>
            <span className="hidden sm:inline text-xs text-slate-400">· painel interno</span>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {modules.map((m) => (
              <Link
                key={m}
                href={MODULE_PATHS[m]}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === MODULE_PATHS[m]
                    ? "bg-violet-100 text-violet-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{ICONS[m]}</span>
                {MODULE_LABELS[m]}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-slate-400">{memberName}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Bottom tab bar: mobile only */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-10 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação principal"
      >
        <div className={`grid`} style={{ gridTemplateColumns: `repeat(${modules.length}, minmax(0, 1fr))` }}>
          {modules.map((m) => {
            const active = pathname === MODULE_PATHS[m];
            return (
              <Link
                key={m}
                href={MODULE_PATHS[m]}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-violet-700" : "text-slate-400"
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
