import type { Module, MemberRole } from "./types";

const ROLE_MODULES: Record<MemberRole, Module[]> = {
  master: ["agenda", "engajamento", "ideias", "admin"],
  full: ["agenda", "engajamento", "ideias"],
  engagement_only: ["engajamento"],
  agenda_only: ["agenda"],
};

export function allowedModules(role: MemberRole): Module[] {
  return ROLE_MODULES[role];
}

export function canAccess(role: MemberRole, mod: Module): boolean {
  return ROLE_MODULES[role].includes(mod);
}

export function defaultPathFor(role: MemberRole): string {
  const mods = allowedModules(role);
  return `/painel/${mods[0]}`;
}

export const MODULE_LABELS: Record<Module, string> = {
  agenda: "Agenda da semana",
  engajamento: "Monitoramento de engajamento",
  ideias: "Banco de ideias",
  admin: "Administração",
};

export const MODULE_PATHS: Record<Module, string> = {
  agenda: "/painel/agenda",
  engajamento: "/painel/engajamento",
  ideias: "/painel/ideias",
  admin: "/painel/admin",
};
