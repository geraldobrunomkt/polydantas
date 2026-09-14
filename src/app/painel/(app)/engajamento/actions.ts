"use server";

import { db } from "@/lib/supabase";
import { requireMember } from "@/lib/session";
import { revalidatePath } from "next/cache";

const PATH = "/painel/engajamento";

export async function addPost(formData: FormData) {
  const member = await requireMember("engajamento");
  const title = String(formData.get("title") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const post_date = String(formData.get("post_date") ?? "").trim();
  if (!title || !link) return;

  await db.from("engagement_posts").insert({
    title,
    link,
    post_date: post_date || new Date().toISOString().slice(0, 10),
    created_by: member.id,
  });

  revalidatePath(PATH);
}

export async function deletePost(postId: string) {
  await requireMember("engajamento");
  await db.from("engagement_posts").delete().eq("id", postId);
  revalidatePath(PATH);
}

export async function addRosterMember(formData: FormData) {
  await requireMember("engajamento");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.from("engagement_roster").insert({ name });
  revalidatePath(PATH);
}

export async function removeRosterMember(rosterId: string) {
  await requireMember("engajamento");
  await db.from("engagement_roster").delete().eq("id", rosterId);
  revalidatePath(PATH);
}

export async function toggleCheck(
  postId: string,
  rosterId: string,
  checked: boolean
) {
  const member = await requireMember("engajamento");

  await db.from("engagement_checks").upsert(
    {
      post_id: postId,
      roster_id: rosterId,
      checked,
      checked_by: member.id,
      checked_at: checked ? new Date().toISOString() : null,
    },
    { onConflict: "post_id,roster_id" }
  );

  revalidatePath(PATH);
}
