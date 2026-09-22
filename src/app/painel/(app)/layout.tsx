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
  if (!member) redirect("/painel/login");

  return (
    <div className="min-h-screen bg-surface">
      <Nav memberName={member.name} modules={allowedModules(member.role)} />
      <main className="sm:pl-20 lg:pl-60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 pb-24 sm:pb-8">{children}</div>
      </main>
    </div>
  );
}
