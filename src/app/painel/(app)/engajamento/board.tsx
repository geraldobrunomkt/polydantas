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

  const stats = useMemo(() => {
    const totalPosts = posts.length;
    return roster
      .map((r) => {
        const commented = checks.filter((c) => c.roster_id === r.id && c.checked).length;
        const rate = totalPosts > 0 ? commented / totalPosts : 0;
        return { id: r.id, name: r.name, commented, totalPosts, rate };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [roster, checks, posts]);

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
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Novo post
          </button>
        </div>
      </div>

      {showRoster && (
        <RosterManager roster={roster} stats={stats} onDone={() => setShowRoster(false)} />
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

type MemberStat = {
  id: string;
  name: string;
  commented: number;
  totalPosts: number;
  rate: number;
};

function RosterManager({
  roster,
  stats,
  onDone,
}: {
  roster: EngagementRosterMember[];
  stats: MemberStat[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white shadow-sm p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-700">Pessoas do grupo de engajamento</h2>
        <button onClick={onDone} className="text-sm text-slate-400 hover:text-slate-600">
          Fechar
        </button>
      </div>

      {stats.length > 0 && stats[0].totalPosts > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Quem mais e quem menos comenta
          </h3>
          <div className="space-y-1.5">
            {stats.map((s) => {
              const pct = Math.round(s.rate * 100);
              const needsAttention = s.rate < 0.5;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-slate-700 truncate">{s.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${needsAttention ? "bg-amber-400" : "bg-green-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-xs text-slate-500 text-right">
                    {s.commented}/{s.totalPosts} ({pct}%)
                  </span>
                  {needsAttention && (
                    <span title="Precisa de atenção" className="text-amber-500 text-xs">
                      ⚠️
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form
        action={(fd) => startTransition(() => addRosterMember(fd))}
        className="flex gap-2 mb-3"
      >
        <input
          name="name"
          placeholder="Nome da pessoa"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
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
      className="rounded-3xl border border-slate-200/70 bg-white shadow-sm p-4 space-y-3"
    >
      <h2 className="font-medium text-slate-700">Novo post para monitorar</h2>
      <input
        name="title"
        placeholder="Título / descrição do post"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        name="link"
        type="url"
        placeholder="Link do post"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        name="post_date"
        type="date"
        defaultValue={today}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
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
    <div className="rounded-3xl border border-slate-200/70 bg-white shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-medium text-slate-800">{post.title}</h3>
          <a
            href={post.link}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-600 hover:underline break-all"
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
        <div className={`mt-4 flex flex-wrap gap-x-4 gap-y-3 ${isPending ? "opacity-60" : ""}`}>
          {roster.map((r) => {
            const checked = !!checkedMap.get(r.id);
            const initials = r.name
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("");
            return (
              <button
                key={r.id}
                onClick={() => startTransition(() => toggleCheck(post.id, r.id, !checked))}
                title={checked ? `${r.name} · comentou` : `${r.name} · marcar como comentou`}
                className="flex flex-col items-center gap-1 w-16 group"
              >
                <span
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition ${
                    checked
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-slate-100 border-slate-200 text-slate-400 group-hover:border-slate-300"
                  }`}
                >
                  {checked ? "✓" : initials}
                </span>
                <span className="text-[11px] text-slate-500 text-center leading-tight truncate w-full">
                  {r.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
