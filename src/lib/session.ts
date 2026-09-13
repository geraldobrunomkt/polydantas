import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./supabase";
import { verifySession, signSession } from "./crypto";
import { canAccess, defaultPathFor } from "./permissions";
import type { Module, TeamMember } from "./types";

export const SESSION_COOKIE = "poly_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function createSessionCookie(memberId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(memberId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentMember(): Promise<TeamMember | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const verified = verifySession(token);
  if (!verified) return null;

  const { data, error } = await db
    .from("team_members")
    .select("*")
    .eq("id", verified.id)
    .single();

  if (error || !data || !data.active) return null;
  return data as TeamMember;
}

export async function requireMember(mod: Module): Promise<TeamMember> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (!canAccess(member.role, mod)) redirect(defaultPathFor(member.role));
  return member;
}
