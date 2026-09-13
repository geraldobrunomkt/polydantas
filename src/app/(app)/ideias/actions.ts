"use server";

import { db } from "@/lib/supabase";
import { requireMember } from "@/lib/session";
import { revalidatePath } from "next/cache";

const PATH = "/ideias";

export async function addIdea(formData: FormData) {
  const member = await requireMember("ideias");
  const text = String(formData.get("text") ?? "").trim();
  const color = String(formData.get("color") ?? "yellow");
  if (!text) return;

  await db.from("idea_cards").insert({ text, color, created_by: member.id });
  revalidatePath(PATH);
}

export async function deleteIdea(id: string) {
  await requireMember("ideias");
  await db.from("idea_cards").delete().eq("id", id);
  revalidatePath(PATH);
}
