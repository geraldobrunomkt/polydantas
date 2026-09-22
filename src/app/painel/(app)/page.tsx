import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { allowedModules, MODULE_LABELS, MODULE_PATHS } from "@/lib/permissions";
import { db } from "@/lib/supabase";
import Link from "next/link";

const DESCRIPTIONS: Record<string, string> = {
  agenda: "Compromissos da candidata: data, hora, local e ideia de conteúdo do dia.",
  engajamento: "Acompanhe quem comentou em cada post no grupo de engajamento.",
  ideias: "Post-its com ideias de conteúdo, sem compromisso.",
  aprovacao: "Envie posts, aprove e agende para Instagram e TikTok.",
  admin: "Gerencie a equipe: nomes, funções e PINs.",
};

const ICONS: Record<string, string> = {
  agenda: "📅",
  engajamento: "✅",
  ideias: "💡",
  aprovacao: "🖼️",
  admin: "⚙️",
};

const BADGE_STYLES: Record<string, string> = {
  agenda: "bg-brand-100 text-brand-700",
  engajamento: "bg-[#00ffe4]/20 text-brand-800",
  ideias: "bg-[#fff000]/30 text-brand-900",
  aprovacao: "bg-pink-100 text-pink-700",
  admin: "bg-slate-100 text-slate-700",
};

export default async function HomePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/painel/login");

  const modules = allowedModules(member.role);
  if (modules.length === 1) redirect(MODULE_PATHS[modules[0]]);

  const today = new Date().toISOString().slice(0, 10);
  const [{ count: upcoming }, { count: posts }, { count: ideas }, { data: checks }] =
    await Promise.all([
      db
        .from("agenda_items")
        .select("*", { count: "exact", head: true })
        .gte("item_date", today),
      db.from("engagement_posts").select("*", { count: "exact", head: true }),
      db.from("idea_cards").select("*", { count: "exact", head: true }),
      db.from("engagement_checks").select("checked"),
    ]);

  const totalChecks = checks?.length ?? 0;
  const doneChecks = checks?.filter((c) => c.checked).length ?? 0;
  const engagementRate = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-1">
        Olá, {member.name.split(" ")[0]}
      </h1>
      <p className="text-sm text-slate-500 mb-6">Aqui está um resumo de hoje.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <StatTile
          label="Compromissos futuros"
          value={upcoming ?? 0}
          icon="📅"
          accent="bg-brand-600"
        />
        <StatTile
          label="Posts monitorados"
          value={posts ?? 0}
          icon="✅"
          accent="bg-slate-700"
        />
        <StatTile
          label="Ideias soltas"
          value={ideas ?? 0}
          icon="💡"
          accent="bg-amber-500"
        />
        {engagementRate !== null && (
          <StatTile
            label="Taxa de engajamento"
            value={`${engagementRate}%`}
            icon="📈"
            accent={engagementRate >= 70 ? "bg-green-600" : "bg-orange-500"}
          />
        )}
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        O que você quer abrir?
      </p>
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

function StatTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm text-white ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-1.5">{label}</p>
    </div>
  );
}
