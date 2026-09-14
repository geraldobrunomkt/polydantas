"use client";

import { useState, useTransition } from "react";
import type { TeamMember, MemberRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { addMember, updateMember, resetPin, toggleActive, deleteMember } from "./actions";

export default function Board({
  members,
  currentId,
}: {
  members: TeamMember[];
  currentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Administração da equipe</h1>
        <p className="text-sm text-slate-500">
          Adicione pessoas, defina a função de cada uma e gerencie os PINs.
        </p>
      </div>

      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            const result = await addMember(fd);
            if (result?.error) setError(result.error);
            else (document.getElementById("new-member-form") as HTMLFormElement)?.reset();
          })
        }
        id="new-member-form"
        className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
          <input
            name="name"
            required
            placeholder="Nome da pessoa"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Função</label>
          <select
            name="role"
            defaultValue="full"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {Object.entries(ROLE_LABELS)
              .filter(([role]) => role !== "master")
              .map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
          </select>
        </div>
        <button
          disabled={isPending}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Adicionar pessoa
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-400">
        A pessoa cria o próprio PIN no primeiro acesso, digitando o nome exatamente como
        cadastrado aqui.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} isSelf={m.id === currentId} />
        ))}
      </div>
    </div>
  );
}

function MemberRow({ member, isSelf }: { member: TeamMember; isSelf: boolean }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(member.name);
  const [isPending, startTransition] = useTransition();

  function saveName() {
    if (name.trim() && name.trim() !== member.name) {
      startTransition(() => updateMember(member.id, { name: name.trim() }));
    }
    setEditingName(false);
  }

  return (
    <div className={`p-4 flex flex-wrap items-center gap-3 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-[140px]">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="font-medium text-slate-800 hover:text-violet-600 text-left"
            title="Clique para editar o nome"
          >
            {member.name}
            {isSelf && <span className="text-xs text-slate-400 ml-1">(você)</span>}
          </button>
        )}
        <div className="text-xs text-slate-400 mt-0.5">
          {member.pin_hash ? "PIN configurado" : "aguardando primeiro acesso"}
          {!member.active && " · desativado"}
        </div>
      </div>

      <select
        value={member.role}
        disabled={isSelf}
        onChange={(e) =>
          startTransition(() =>
            updateMember(member.id, { role: e.target.value as MemberRole })
          )
        }
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <option key={role} value={role}>
            {label}
          </option>
        ))}
      </select>

      <button
        onClick={() => startTransition(() => resetPin(member.id))}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
      >
        Resetar PIN
      </button>

      <button
        onClick={() => startTransition(() => toggleActive(member.id, !member.active))}
        disabled={isSelf}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
      >
        {member.active ? "Desativar" : "Ativar"}
      </button>

      <button
        onClick={() => {
          if (confirm(`Remover ${member.name} definitivamente?`)) {
            startTransition(() => deleteMember(member.id));
          }
        }}
        disabled={isSelf}
        className="text-sm text-slate-300 hover:text-red-600 disabled:opacity-30"
      >
        excluir
      </button>
    </div>
  );
}
