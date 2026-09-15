"use server";

import { db } from "@/lib/supabase";
import { getCurrentMember } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { MemberRole } from "@/lib/types";

const PATH = "/painel/admin";

async function requireMaster() {
  const member = await getCurrentMember();
  if (!member) redirect("/painel/login");
  if (member.role !== "master") redirect("/painel");
  return member;
}

export async function addMember(formData: FormData) {
  await requireMaster();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "full") as MemberRole;
  if (!name) return { error: "Digite um nome." };

  const { error } = await db
    .from("team_members")
    .insert({ name, email: email || null, role, active: true });
  if (error) return { error: "Já existe alguém com esse nome." };

  revalidatePath(PATH);
  return {};
}

export async function updateMember(
  id: string,
  data: { name?: string; email?: string; role?: MemberRole }
) {
  await requireMaster();
  const patch: Record<string, string> = {};
  if (data.name?.trim()) patch.name = data.name.trim();
  if (data.email !== undefined) patch.email = data.email.trim();
  if (data.role) patch.role = data.role;
  if (Object.keys(patch).length === 0) return;

  await db.from("team_members").update(patch).eq("id", id);
  revalidatePath(PATH);
}

export async function resetPin(id: string) {
  await requireMaster();
  await db.from("team_members").update({ pin_hash: null }).eq("id", id);
  revalidatePath(PATH);
}

export async function toggleActive(id: string, active: boolean) {
  const me = await requireMaster();
  if (id === me.id && !active) return;
  await db.from("team_members").update({ active }).eq("id", id);
  revalidatePath(PATH);
}

export async function deleteMember(id: string) {
  const me = await requireMaster();
  if (id === me.id) return;
  await db.from("team_members").delete().eq("id", id);
  revalidatePath(PATH);
}
