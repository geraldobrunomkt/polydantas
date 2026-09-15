import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { allowedModules, MODULE_LABELS, MODULE_PATHS } from "@/lib/permissions";
import Link from "next/link";

const DESCRIPTIONS: Record<string, string> = {
  agenda: "Compromissos da candidata: data, hora, local e ideia de conteúdo do dia.",
  engajamento: "Acompanhe quem comentou em cada post no grupo de engajamento.",
  ideias: "Post-its com ideias de conteúdo, sem compromisso.",
  admin: "Gerencie a equipe: nomes, funções e PINs.",
};

const ICONS: Record<string, string> = {
  agenda: "📅",
  engajamento: "✅",
  ideias: "💡",
  admin: "⚙️",
};

const BADGE_STYLES: Record<string, string> = {
  agenda: "bg-brand-100 text-brand-700",
  engajamento: "bg-[#00ffe4]/20 text-brand-800",
  ideias: "bg-[#fff000]/30 text-brand-900",
  admin: "bg-slate-100 text-slate-700",
};

export default async function HomePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/painel/login");

  const modules = allowedModules(member.role);
  if (modules.length === 1) redirect(MODULE_PATHS[modules[0]]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-1">
        Olá, {member.name.split(" ")[0]}
      </h1>
      <p className="text-sm text-slate-500 mb-6">O que você quer abrir?</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m}
            href={MODULE_PATHS[m]}
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md active:scale-[0.98] transition"
          >
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg mb-3 ${BADGE_STYLES[m]}`}
            >
              {ICONS[m]}
            </div>
            <h2 className="font-semibold text-slate-800">{MODULE_LABELS[m]}</h2>
            <p className="text-sm text-slate-500 mt-1">{DESCRIPTIONS[m]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
