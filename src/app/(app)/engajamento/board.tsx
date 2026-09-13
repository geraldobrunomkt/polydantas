"use client";

import { useMemo, useState, useTransition } from "react";
import type { EngagementPost, EngagementRosterMember, EngagementCheck } from "@/lib/types";
import { addPost, deletePost, addRosterMember, removeRosterMember, toggleCheck } from "./actions";

export default function Board({
  posts,
  roster,
  checks,
}: {
  posts: EngagementPost[];
  roster: EngagementRosterMember[];
  checks: EngagementCheck[];
}) {
  const [showRoster, setShowRoster] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);

  const checksByPost = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    for (const c of checks) {
      if (!map.has(c.post_id)) map.set(c.post_id, new Map());
      map.get(c.post_id)!.set(c.roster_id, c.checked);
    }
    return map;
  }, [checks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Monitoramento de engajamento</h1>
          <p className="text-sm text-slate-500">
            {roster.length} pessoa{roster.length === 1 ? "" : "s"} no grupo de engajamento
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoster((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            👥 Gerenciar pessoas
          </button>
          <button
            onClick={() => setShowNewPost((v) => !v)}
            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Novo post
          </button>
        </div>
      </div>

      {showRoster && (
        <RosterManager roster={roster} onDone={() => setShowRoster(false)} />
      )}

      {showNewPost && <NewPostForm onDone={() => setShowNewPost(false)} />}

      {posts.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-10">
          Nenhum post cadastrado ainda. Clique em &quot;Novo post&quot; para começar.
        </p>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            roster={roster}
            checkedMap={checksByPost.get(post.id) ?? new Map()}
          />
        ))}
      </div>
    </div>
  );
}

function RosterManager({
  roster,
  onDone,
}: {
  roster: EngagementRosterMember[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-slate-700">Pessoas do grupo de engajamento</h2>
        <button onClick={onDone} className="text-sm text-slate-400 hover:text-slate-600">
          Fechar
        </button>
      </div>
      <form
        action={(fd) => startTransition(() => addRosterMember(fd))}
        className="flex gap-2 mb-3"
      >
        <input
          name="name"
          placeholder="Nome da pessoa"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          disabled={isPending}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {roster.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-2 rounded-full bg-slate-100 pl-3 pr-1 py-1 text-sm text-slate-700"
          >
            {r.name}
            <button
              onClick={() => startTransition(() => removeRosterMember(r.id))}
              className="rounded-full w-5 h-5 leading-5 text-center text-slate-400 hover:bg-slate-200 hover:text-red-600"
              title="Remover"
            >
              ×
            </button>
          </li>
        ))}
        {roster.length === 0 && (
          <li className="text-sm text-slate-400">Ninguém cadastrado ainda.</li>
        )}
      </ul>
    </div>
  );
}

function NewPostForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await addPost(fd);
          onDone();
        })
      }
      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
    >
      <h2 className="font-medium text-slate-700">Novo post para monitorar</h2>
      <input
        name="title"
        placeholder="Título / descrição do post"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      <input
        name="link"
        type="url"
        placeholder="Link do post"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      <input
        name="post_date"
        type="date"
        defaultValue={today}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar post"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PostCard({
  post,
  roster,
  checkedMap,
}: {
  post: EngagementPost;
  roster: EngagementRosterMember[];
  checkedMap: Map<string, boolean>;
}) {
  const [isPending, startTransition] = useTransition();
  const total = roster.length;
  const done = roster.filter((r) => checkedMap.get(r.id)).length;
  const complete = total > 0 && done === total;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-medium text-slate-800">{post.title}</h3>
          <a
            href={post.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-violet-600 hover:underline break-all"
          >
            {post.link}
          </a>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(post.post_date + "T00:00:00").toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-medium rounded-full px-3 py-1 ${
              complete
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {done}/{total} comentaram
          </span>
          <button
            onClick={() => startTransition(() => deletePost(post.id))}
            className="text-slate-300 hover:text-red-600 text-sm"
            title="Excluir post"
          >
            excluir
          </button>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-slate-400 mt-3">
          Cadastre pessoas em &quot;Gerenciar pessoas&quot; para começar a marcar.
        </p>
      ) : (
        <div className={`mt-3 flex flex-wrap gap-2 ${isPending ? "opacity-60" : ""}`}>
          {roster.map((r) => {
            const checked = !!checkedMap.get(r.id);
            return (
              <button
                key={r.id}
                onClick={() => startTransition(() => toggleCheck(post.id, r.id, !checked))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  checked
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span>{checked ? "✅" : "⬜️"}</span>
                {r.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
