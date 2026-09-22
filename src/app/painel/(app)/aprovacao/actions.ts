"use server";

import { db } from "@/lib/supabase";
import { requireMember, getCurrentMember } from "@/lib/session";
import { createBufferUpdates, isBufferUpdateSent } from "@/lib/buffer";
import { uploadToDrive, deleteFromDrive, driveDirectUrl, driveConfigured } from "@/lib/googleDrive";
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
  const errors: string[] = [];
  for (const file of files) {
    const isVideo = file.type.startsWith("video");

    try {
      if (isVideo && driveConfigured()) {
        // Videos vao pro Drive: sem limite de 50MB do bucket do Supabase.
        const { id } = await uploadToDrive(file);
        await db.from("content_post_files").insert({
          post_id: post.id,
          storage_path: id,
          provider: "drive",
          file_type: "video",
          position,
        });
      } else {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${post.id}/${position}-${Date.now()}.${ext}`;
        const buf = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await db.storage.from(BUCKET).upload(path, buf, {
          contentType: file.type || undefined,
        });
        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }
        await db.from("content_post_files").insert({
          post_id: post.id,
          storage_path: path,
          provider: "supabase",
          file_type: isVideo ? "video" : "image",
          position,
        });
      }
      position++;
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : "erro desconhecido"}`);
    }
  }

  if (position === 0) {
    await db.from("content_posts").delete().eq("id", post.id);
    return { error: errors.join(" | ") || "Falha ao enviar os arquivos. Tente de novo." };
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
    .select("id, storage_path, provider")
    .eq("post_id", postId);
  if (!files || files.length === 0) return 0;

  const supabasePaths = files.filter((f) => f.provider !== "drive").map((f) => f.storage_path);
  if (supabasePaths.length > 0) await db.storage.from(BUCKET).remove(supabasePaths);

  const driveFiles = files.filter((f) => f.provider === "drive");
  await Promise.all(driveFiles.map((f) => deleteFromDrive(f.storage_path).catch(() => {})));

  await db.from("content_post_files").delete().eq("post_id", postId);
  return files.length;
}

/**
 * Confere no Buffer quais posts "agendados" ja foram publicados de verdade
 * (nao so a hora do agendamento passou) e, so nesse caso, libera o espaco
 * automaticamente. Chamado toda vez que a tela de Aprovacao carrega.
 * Se o Buffer nao estiver configurado ou a consulta falhar, so ignora aquele
 * post e tenta de novo no proximo carregamento - nunca apaga no escuro.
 */
export async function syncPublishedPosts() {
  const { data: posts } = await db
    .from("content_posts")
    .select("id, buffer_update_ids")
    .eq("status", "scheduled")
    .not("buffer_update_ids", "is", null);

  for (const post of posts ?? []) {
    const ids = post.buffer_update_ids ?? [];
    if (ids.length === 0) continue;

    const results = await Promise.all(ids.map((id: string) => isBufferUpdateSent(id)));
    if (results.some((r) => r === null)) continue; // consulta falhou, tenta de novo depois
    if (!results.every((r) => r === true)) continue; // ainda nao publicou tudo

    await db.from("content_posts").update({ status: "published" }).eq("id", post.id);
    await removeFiles(post.id);
  }
  // Sem revalidatePath aqui de proposito: essa funcao roda durante o
  // carregamento da propria pagina (page.tsx ja busca os dados frescos logo
  // em seguida), e chamar revalidatePath durante o render quebra o Next.js.
}

/**
 * Apaga só os arquivos de um post manualmente, mantendo o registro (legenda,
 * quando foi publicado etc.) no histórico. Complementa o syncPublishedPosts
 * automático - útil se o Buffer não estiver configurado ou para casos em que
 * a checagem automática ainda não rodou.
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
    .select("storage_path, provider")
    .eq("post_id", id)
    .order("position");

  const { data: post } = await db
    .from("content_posts")
    .select("caption")
    .eq("id", id)
    .single();

  const mediaUrls = (files ?? []).map((f) =>
    f.provider === "drive"
      ? driveDirectUrl(f.storage_path)
      : db.storage.from(BUCKET).getPublicUrl(f.storage_path).data.publicUrl
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
