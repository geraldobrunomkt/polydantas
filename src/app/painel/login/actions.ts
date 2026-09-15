"use server";

import { db } from "@/lib/supabase";
import { hashPin, verifyPin } from "@/lib/crypto";
import { createSessionCookie } from "@/lib/session";
import { defaultPathFor } from "@/lib/permissions";
import { redirect } from "next/navigation";

export type NameCheckResult =
  | { status: "not_found" }
  | { status: "needs_pin"; name: string }
  | { status: "has_pin"; name: string }
  | { status: "error"; message: string };

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

const CONNECTION_ERROR =
  "Não foi possível conectar ao banco de dados.";

export async function checkName(rawName: string): Promise<NameCheckResult> {
  const name = normalizeName(rawName);
  if (!name) return { status: "not_found" };

  const { data, error } = await db
    .from("team_members")
    .select("name, pin_hash, active")
    .ilike("name", name)
    .maybeSingle();

  if (error) return { status: "error", message: CONNECTION_ERROR };
  if (!data || !data.active) return { status: "not_found" };

  return data.pin_hash
    ? { status: "has_pin", name: data.name }
    : { status: "needs_pin", name: data.name };
}

export async function setFirstPin(
  rawName: string,
  pin: string
): Promise<{ error?: string }> {
  const name = normalizeName(rawName);
  if (!/^\d{4,6}$/.test(pin)) return { error: "O PIN deve ter de 4 a 6 números." };

  const { data: member } = await db
    .from("team_members")
    .select("id, pin_hash, active")
    .ilike("name", name)
    .maybeSingle();

  if (!member || !member.active) return { error: "Usuário não encontrado." };
  if (member.pin_hash) return { error: "Este usuário já tem um PIN. Faça login normalmente." };

  const { error } = await db
    .from("team_members")
    .update({ pin_hash: hashPin(pin) })
    .eq("id", member.id);

  if (error) return { error: "Não foi possível salvar o PIN." };

  await createSessionCookie(member.id);
  redirect("/painel");
}

export async function login(
  rawName: string,
  pin: string
): Promise<{ error?: string }> {
  const name = normalizeName(rawName);

  const { data: member } = await db
    .from("team_members")
    .select("id, pin_hash, active, role")
    .ilike("name", name)
    .maybeSingle();

  if (!member || !member.active || !member.pin_hash) {
    return { error: "Usuário não encontrado." };
  }

  if (!verifyPin(pin, member.pin_hash)) {
    return { error: "PIN incorreto." };
  }

  await createSessionCookie(member.id);
  redirect(defaultPathFor(member.role));
}
