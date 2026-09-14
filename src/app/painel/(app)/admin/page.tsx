import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { db } from "@/lib/supabase";
import type { TeamMember } from "@/lib/types";
import Board from "./board";

export default async function AdminPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/painel/login");
  if (member.role !== "master") redirect("/painel");

  const { data } = await db
    .from("team_members")
    .select("*")
    .order("created_at", { ascending: true });

  return <Board members={(data ?? []) as TeamMember[]} currentId={member.id} />;
}
