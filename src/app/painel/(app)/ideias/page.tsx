import { requireMember } from "@/lib/session";
import { db } from "@/lib/supabase";
import type { IdeaCard } from "@/lib/types";
import Board from "./board";

export default async function IdeiasPage() {
  await requireMember("ideias");

  const { data } = await db
    .from("idea_cards")
    .select("*")
    .order("created_at", { ascending: false });

  return <Board ideas={(data ?? []) as IdeaCard[]} />;
}
