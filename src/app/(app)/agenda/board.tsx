"use client";

import { useMemo, useState, useTransition } from "react";
import type { AgendaItem } from "@/lib/types";
import { addItem, updateItem, deleteItem } from "./actions";

function formatDateHeading(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
  const rest = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${rest}`;
}

export default function Board({ items }: { items: AgendaItem[] }) {
  const [showNew, setShowNew] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of items) {
      if (!map.has(item.item_date)) map.set(item.item_date, []);
      map.get(item.item_date)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Agenda da semana</h1>
          <p className="text-sm text-slate-500">Compromissos, local e ideia de conteúdo do dia</p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          + Novo compromisso
        </button>
      </div>

      {showNew && (
        <ItemForm
          onSubmit={async (fd) => {
            await addItem(fd);
            setShowNew(false);
          }}
          onCancel={() => setShowNew(false)}
          submitLabel="Salvar compromisso"
        />
      )}

      {groups.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-10">
          Nenhum compromisso cadastrado ainda.
        </p>
      )}

      <div className="space-y-6">
        {groups.map(([date, dayItems]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-violet-700 mb-2">
              {formatDateHeading(date)}
            </h2>
            <div className="space-y-3">
              {dayItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: AgendaItem }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <ItemForm
        item={item}
        onSubmit={async (fd) => {
          await updateItem(item.id, fd);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        submitLabel="Salvar alterações"
      />
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {item.item_time && <span>🕒 {item.item_time.slice(0, 5)}</span>}
            {item.location && <span>📍 {item.location}</span>}
          </div>
          <h3 className="font-medium text-slate-800 mt-1">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{item.description}</p>
          )}
          {item.content_idea && (
            <div className="mt-2 rounded-lg bg-violet-50 border border-violet-100 px-3 py-2 text-sm text-violet-800">
              💡 <strong>Ideia de conteúdo:</strong> {item.content_idea}
            </div>
          )}
        </div>
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setEditing(true)}
            className="text-slate-400 hover:text-violet-600"
          >
            editar
          </button>
          <button
            onClick={() => startTransition(() => deleteItem(item.id))}
            className="text-slate-300 hover:text-red-600"
          >
            excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemForm({
  item,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  item?: AgendaItem;
  onSubmit: (fd: FormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => onSubmit(fd))}
      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
          <input
            name="item_date"
            type="date"
            defaultValue={item?.item_date}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hora</label>
          <input
            name="item_time"
            type="time"
            defaultValue={item?.item_time?.slice(0, 5)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Local</label>
        <input
          name="location"
          defaultValue={item?.location ?? ""}
          placeholder="Ex: Praça Central"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Título / programação</label>
        <input
          name="title"
          defaultValue={item?.title ?? ""}
          required
          placeholder="Ex: Caminhada no centro"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Detalhes</label>
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          rows={2}
          placeholder="Detalhes da programação"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          💡 Ideia de conteúdo para o dia
        </label>
        <textarea
          name="content_idea"
          defaultValue={item?.content_idea ?? ""}
          rows={2}
          placeholder="O que gravar/postar nesse compromisso"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending ? "Salvando..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
