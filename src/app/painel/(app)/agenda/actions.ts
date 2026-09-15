"use server";

import { db } from "@/lib/supabase";
import { requireMember } from "@/lib/session";
import { revalidatePath } from "next/cache";

const PATH = "/painel/agenda";

function readItem(formData: FormData) {
  return {
    item_date: String(formData.get("item_date") ?? ""),
    item_time: String(formData.get("item_time") ?? "") || null,
    location: String(formData.get("location") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    content_idea: String(formData.get("content_idea") ?? "").trim() || null,
  };
}

export async function addItem(formData: FormData) {
  const member = await requireMember("agenda");
  const item = readItem(formData);
  if (!item.title || !item.item_date) return;

  await db.from("agenda_items").insert({ ...item, created_by: member.id });
  revalidatePath(PATH);
}

export async function updateItem(id: string, formData: FormData) {
  await requireMember("agenda");
  const item = readItem(formData);
  if (!item.title || !item.item_date) return;

  await db.from("agenda_items").update(item).eq("id", id);
  revalidatePath(PATH);
}

export async function deleteItem(id: string) {
  await requireMember("agenda");
  await db.from("agenda_items").delete().eq("id", id);
  revalidatePath(PATH);
}

export type BulkItem = {
  item_date: string;
  item_time: string | null;
  location: string | null;
  title: string;
  description: string | null;
  content_idea: string | null;
};

export async function addItemsBulk(items: BulkItem[]) {
  const member = await requireMember("agenda");
  const valid = items.filter((i) => i.title.trim() && i.item_date);
  if (valid.length === 0) return { error: "Nenhum compromisso válido para salvar." };

  const rows = valid.map((i) => ({ ...i, created_by: member.id }));
  const { error } = await db.from("agenda_items").insert(rows);
  if (error) return { error: "Não foi possível salvar os compromissos." };

  revalidatePath(PATH);
  return { saved: valid.length };
}
