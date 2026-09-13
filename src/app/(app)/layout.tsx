import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { allowedModules } from "@/lib/permissions";
import Nav from "./nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav memberName={member.name} modules={allowedModules(member.role)} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
