import { requireMember } from "@/lib/session";
import { db } from "@/lib/supabase";
import type { AgendaItem } from "@/lib/types";
import Board from "./board";

export default async function AgendaPage() {
  await requireMember("agenda");

  const { data } = await db
    .from("agenda_items")
    .select("*")
    .order("item_date", { ascending: true })
    .order("item_time", { ascending: true, nullsFirst: false });

  return <Board items={(data ?? []) as AgendaItem[]} />;
}
