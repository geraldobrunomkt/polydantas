"use server";

import { clearSessionCookie } from "@/lib/session";
import { redirect } from "next/navigation";

export async function logout() {
  await clearSessionCookie();
  redirect("/painel/login");
}
