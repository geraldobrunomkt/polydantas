import { requireMember } from "@/lib/session";
import { db } from "@/lib/supabase";
import type { EngagementPost, EngagementRosterMember, EngagementCheck } from "@/lib/types";
import Board from "./board";

export default async function EngajamentoPage() {
  await requireMember("engajamento");

  const [{ data: posts }, { data: roster }, { data: checks }] = await Promise.all([
    db
      .from("engagement_posts")
      .select("*")
      .order("post_date", { ascending: false })
      .order("created_at", { ascending: false }),
    db.from("engagement_roster").select("*").eq("active", true).order("name"),
    db.from("engagement_checks").select("*"),
  ]);

  return (
    <Board
      posts={(posts ?? []) as EngagementPost[]}
      roster={(roster ?? []) as EngagementRosterMember[]}
      checks={(checks ?? []) as EngagementCheck[]}
    />
  );
}
