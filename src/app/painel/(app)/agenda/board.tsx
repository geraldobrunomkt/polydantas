"use client";

import { useMemo, useState, useTransition } from "react";
import type { AgendaItem } from "@/lib/types";
import { addItem, updateItem, deleteItem, addItemsBulk } from "./actions";
import { organizeAgendaText, organizeAgendaBulk, type AgendaItemDraft } from "./ai-actions";
import type { ChatTurn } from "@/lib/gemini";

function formatDateHeading(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
  const rest = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${rest}`;
}

export default function Board({ items }: { items: AgendaItem[] }) {
  const [showNew, setShowNew] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [draft, setDraft] = useState<Partial<AgendaItem>>({});
  const [formKey, setFormKey] = useState(0);

  function closeNew() {
    setShowNew(false);
    setDraft({});
  }

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
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulk((v) => !v)}
            className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            ✨ Importar semana com IA
          </button>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Novo compromisso
          </button>
        </div>
      </div>

      {showBulk && <BulkImport onDone={() => setShowBulk(false)} />}

      {showNew && (
        <div className="space-y-3">
          <AiAssist
            onApply={(patch) => {
              setDraft((d) => ({ ...d, ...patch }));
              setFormKey((k) => k + 1);
            }}
          />
          <ItemForm
            key={formKey}
            item={draft}
            onSubmit={async (fd) => {
              await addItem(fd);
              closeNew();
            }}
            onCancel={closeNew}
            submitLabel="Salvar compromisso"
          />
        </div>
      )}

      {groups.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-10">
          Nenhum compromisso cadastrado ainda.
        </p>
      )}

      <div className="space-y-6">
        {groups.map(([date, dayItems]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-brand-700 mb-2">
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
            <div className="mt-2 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2 text-sm text-brand-800">
              💡 <strong>Ideia de conteúdo:</strong> {item.content_idea}
            </div>
          )}
        </div>
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setEditing(true)}
            className="text-slate-400 hover:text-brand-600"
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
  item?: Partial<AgendaItem>;
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hora</label>
          <input
            name="item_time"
            type="time"
            defaultValue={item?.item_time?.slice(0, 5)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Local</label>
        <input
          name="location"
          defaultValue={item?.location ?? ""}
          placeholder="Ex: Praça Central"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Título / programação</label>
        <input
          name="title"
          defaultValue={item?.title ?? ""}
          required
          placeholder="Ex: Caminhada no centro"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Detalhes</label>
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          rows={2}
          placeholder="Detalhes da programação"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
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

function BulkImport({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<AgendaItemDraft[] | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function organize() {
    if (!text.trim() || isPending) return;
    setError(null);
    setSaveMsg(null);
    startTransition(async () => {
      const result = await organizeAgendaBulk(text);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDrafts(result.items);
      setReply(result.reply);
    });
  }

  function updateDraft(index: number, patch: Partial<AgendaItemDraft>) {
    setDrafts((cur) => cur?.map((d, i) => (i === index ? { ...d, ...patch } : d)) ?? cur);
  }

  function removeDraft(index: number) {
    setDrafts((cur) => cur?.filter((_, i) => i !== index) ?? cur);
  }

  function saveAll() {
    if (!drafts || drafts.length === 0 || isPending) return;
    startTransition(async () => {
      const result = await addItemsBulk(drafts);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaveMsg(`${result?.saved ?? 0} compromissos salvos na agenda.`);
      setDrafts(null);
      setText("");
      setTimeout(onDone, 1200);
    });
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h3 className="font-medium text-brand-900 text-sm">
          Cole ou escreva a agenda inteira da semana
        </h3>
      </div>

      {!drafts && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={
              "Ex:\nSegunda dia 22, 9h reunião com apoiadores no bairro Alecrim.\n" +
              "Terça de manhã visita a feira do Passo da Pátria, gravar reels.\n" +
              "Quinta às 15h caminhada na praça central..."
            }
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={organize}
              disabled={isPending || !text.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isPending ? "Organizando..." : "Organizar semana"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {drafts && (
        <div className="space-y-3">
          {reply && (
            <p className="text-sm text-brand-800 bg-white rounded-lg px-3 py-2 border border-brand-100">
              {reply}
            </p>
          )}
          {saveMsg && <p className="text-sm text-green-700">{saveMsg}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {drafts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum compromisso identificado. Volte e tente descrever de novo.
            </p>
          ) : (
            <div className="space-y-2">
              {drafts.map((d, i) => (
                <DraftRow
                  key={i}
                  draft={d}
                  onChange={(patch) => updateDraft(i, patch)}
                  onRemove={() => removeDraft(i)}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {drafts.length > 0 && (
              <button
                type="button"
                onClick={saveAll}
                disabled={isPending}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isPending ? "Salvando..." : `Salvar ${drafts.length} compromissos`}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDrafts(null);
                setReply(null);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Voltar e reescrever
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DraftRow({
  draft,
  onChange,
  onRemove,
}: {
  draft: AgendaItemDraft;
  onChange: (patch: Partial<AgendaItemDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={draft.item_date}
          onChange={(e) => onChange({ item_date: e.target.value })}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="time"
          value={draft.item_time?.slice(0, 5) ?? ""}
          onChange={(e) => onChange({ item_time: e.target.value || null })}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <input
        value={draft.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Título"
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        value={draft.location ?? ""}
        onChange={(e) => onChange({ location: e.target.value || null })}
        placeholder="Local"
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-slate-400 hover:text-red-600"
        >
          remover
        </button>
      </div>
    </div>
  );
}

function AiAssist({
  onApply,
}: {
  onApply: (patch: Partial<AgendaItem>) => void;
}) {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function send() {
    const userMsg = message.trim();
    if (!userMsg || isPending) return;
    setMessage("");
    setError(null);
    startTransition(async () => {
      const result = await organizeAgendaText(history, userMsg);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setHistory((h) => [
        ...h,
        { role: "user", text: userMsg },
        { role: "model", text: JSON.stringify(result) },
      ]);
      setReplies((r) => [...r, result.reply]);
      onApply({
        item_date: result.item_date ?? undefined,
        item_time: result.item_time ?? undefined,
        location: result.location ?? undefined,
        title: result.title ?? undefined,
        description: result.description ?? undefined,
        content_idea: result.content_idea ?? undefined,
      });
    });
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h3 className="font-medium text-brand-900 text-sm">Escreva corrido, a IA organiza</h3>
      </div>

      {replies.length > 0 && (
        <div className="space-y-1.5">
          {replies.map((r, i) => (
            <p
              key={i}
              className="text-sm text-brand-800 bg-white rounded-lg px-3 py-2 border border-brand-100"
            >
              {r}
            </p>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Ex: quinta as 15h na praça central, caminhada com a comunidade, gravar reels perguntando sobre saúde pública"
          className="flex-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="button"
          onClick={send}
          disabled={isPending || !message.trim()}
          className="rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Organizar"}
        </button>
      </div>
      <p className="text-xs text-brand-700/70">
        Os campos abaixo já vêm preenchidos — revise antes de salvar.
      </p>
    </div>
  );
}
