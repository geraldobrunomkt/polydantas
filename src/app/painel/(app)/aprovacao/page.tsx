import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { db } from "@/lib/supabase";
import { bufferConfigured } from "@/lib/buffer";
import { driveDirectUrl } from "@/lib/googleDrive";
import Board from "./board";
import type { ContentPost, ContentPostFile } from "@/lib/types";

const BUCKET = "posts";

export default async function AprovacaoPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/painel/login");

  const [{ data: posts }, { data: files }] = await Promise.all([
    db.from("content_posts").select("*").order("created_at", { ascending: false }),
    db.from("content_post_files").select("*").order("position"),
  ]);

  const filesByPost = new Map<string, (ContentPostFile & { url: string })[]>();
  for (const f of files ?? []) {
    const url =
      f.provider === "drive"
        ? driveDirectUrl(f.storage_path)
        : db.storage.from(BUCKET).getPublicUrl(f.storage_path).data.publicUrl;
    if (!filesByPost.has(f.post_id)) filesByPost.set(f.post_id, []);
    filesByPost.get(f.post_id)!.push({ ...f, url });
  }

  return (
    <Board
      posts={(posts ?? []) as ContentPost[]}
      filesByPost={Object.fromEntries(filesByPost)}
      role={member.role}
      bufferReady={bufferConfigured()}
    />
  );
}
