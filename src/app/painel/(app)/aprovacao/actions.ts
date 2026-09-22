"use server";

import { db } from "@/lib/supabase";
import { requireMember, getCurrentMember } from "@/lib/session";
import { createBufferUpdates } from "@/lib/buffer";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const PATH = "/painel/aprovacao";
const BUCKET = "posts";

async function requireReviewer() {
  const member = await requireMember("aprovacao");
  if (member.role !== "master" && member.role !== "approval_only") {
    redirect(PATH);
  }
  return member;
}

export async function submitPost(formData: FormData) {
  const member = await requireMember("aprovacao");
  const caption = String(formData.get("caption") ?? "").trim();
  const platforms = formData.getAll("platforms").map(String);
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { error: "Selecione pelo menos um arquivo." };

  const { data: post, error: postError } = await db
    .from("content_posts")
    .insert({ caption: caption || null, target_platforms: platforms, created_by: member.id })
    .select("id")
    .single();

  if (postError || !post) return { error: "Não foi possível criar o post." };

  let position = 0;
  for (const file of files) {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${post.id}/${position}-${Date.now()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await db.storage.from(BUCKET).upload(path, buf, {
      contentType: file.type || undefined,
    });
    if (uploadError) continue;

    await db.from("content_post_files").insert({
      post_id: post.id,
      storage_path: path,
      file_type: file.type.startsWith("video") ? "video" : "image",
      position,
    });
    position++;
  }

  if (position === 0) {
    await db.from("content_posts").delete().eq("id", post.id);
    return { error: "Falha ao enviar os arquivos. Tente de novo." };
  }

  revalidatePath(PATH);
  return {};
}

export async function reviewPost(id: string, approve: boolean, note?: string) {
  const member = await requireReviewer();

  await db
    .from("content_posts")
    .update({
      status: approve ? "approved" : "rejected",
      reviewed_by: member.id,
      reviewed_at: new Date().toISOString(),
      review_note: note?.trim() || null,
    })
    .eq("id", id);

  // Reprovado nunca vai ser publicado - libera o espaço no Storage na hora.
  if (!approve) await removeFiles(id);

  revalidatePath(PATH);
}

async function removeFiles(postId: string) {
  const { data: files } = await db
    .from("content_post_files")
    .select("id, storage_path")
    .eq("post_id", postId);
  if (!files || files.length === 0) return 0;
  await db.storage.from(BUCKET).remove(files.map((f) => f.storage_path));
  await db.from("content_post_files").delete().eq("post_id", postId);
  return files.length;
}

/**
 * Apaga só os arquivos de um post já agendado/publicado, mantendo o registro
 * (legenda, quando foi publicado etc.) no histórico. Não é automático de
 * propósito: o Buffer pode buscar a mídia só na hora exata de publicar, então
 * apagar cedo demais arriscaria quebrar um agendamento que ainda não saiu.
 * Use depois de confirmar que o post já foi ao ar.
 */
export async function freeUpSpace(id: string): Promise<{ freed: number }> {
  await requireMember("aprovacao");
  const freed = await removeFiles(id);
  revalidatePath(PATH);
  return { freed };
}

export async function schedulePost(
  id: string,
  scheduledAtISO: string,
  platforms: string[]
): Promise<{ error?: string }> {
  const member = await requireMember("aprovacao");
  if (!scheduledAtISO || platforms.length === 0) {
    return { error: "Escolha data/hora e pelo menos uma plataforma." };
  }

  const { data: files } = await db
    .from("content_post_files")
    .select("storage_path")
    .eq("post_id", id)
    .order("position");

  const { data: post } = await db
    .from("content_posts")
    .select("caption")
    .eq("id", id)
    .single();

  const mediaUrls = (files ?? []).map(
    (f) => db.storage.from(BUCKET).getPublicUrl(f.storage_path).data.publicUrl
  );

  const result = await createBufferUpdates({
    platforms,
    text: post?.caption ?? "",
    mediaUrls,
    scheduledAtISO,
  });

  if ("error" in result) return { error: result.error };

  await db
    .from("content_posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAtISO,
      target_platforms: platforms,
      buffer_update_ids: result.ids,
      scheduled_by: member.id,
    })
    .eq("id", id);

  revalidatePath(PATH);
  return {};
}

export async function deletePost(id: string) {
  await requireMember("aprovacao");
  await removeFiles(id);
  await db.from("content_posts").delete().eq("id", id);
  revalidatePath(PATH);
}

export async function getCurrentReviewerRole() {
  const member = await getCurrentMember();
  return member?.role ?? null;
}
