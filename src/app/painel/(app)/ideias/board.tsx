"use client";

import { useState, useTransition } from "react";
import type { IdeaCard } from "@/lib/types";
import { addIdea, deleteIdea } from "./actions";

const COLORS: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-900",
  pink: "bg-pink-100 border-pink-300 text-pink-900",
  green: "bg-green-100 border-green-300 text-green-900",
  blue: "bg-blue-100 border-blue-300 text-blue-900",
  orange: "bg-orange-100 border-orange-300 text-orange-900",
};

export default function Board({ ideas }: { ideas: IdeaCard[] }) {
  const [color, setColor] = useState("yellow");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const fd = new FormData();
    fd.set("text", text);
    fd.set("color", color);
    startTransition(async () => {
      await addIdea(fd);
      setText("");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Banco de ideias</h1>
        <p className="text-sm text-slate-500">Solte a ideia aqui, sem compromisso</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua ideia..."
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {Object.keys(COLORS).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 ${COLORS[c].split(" ")[0]} ${
                  color === c ? "border-slate-700" : "border-transparent"
                }`}
                aria-label={c}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {isPending ? "Adicionando..." : "Adicionar post-it"}
          </button>
        </div>
      </form>

      {ideas.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-10">Nenhuma ideia ainda.</p>
      )}

      <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
        {ideas.map((idea) => (
          <IdeaNote key={idea.id} idea={idea} />
        ))}
      </div>
    </div>
  );
}

function IdeaNote({ idea }: { idea: IdeaCard }) {
  const [isPending, startTransition] = useTransition();
  const classes = COLORS[idea.color] ?? COLORS.yellow;

  return (
    <div
      className={`break-inside-avoid rounded-lg border p-3 shadow-sm ${classes} ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <p className="text-sm whitespace-pre-wrap">{idea.text}</p>
      <button
        onClick={() => startTransition(() => deleteIdea(idea.id))}
        className="mt-2 text-xs opacity-60 hover:opacity-100"
      >
        remover
      </button>
    </div>
  );
}
