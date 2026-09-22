"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { ContentPost, ContentPostFile, MemberRole } from "@/lib/types";
import { submitPost, reviewPost, schedulePost, deletePost } from "./actions";

type FileWithUrl = ContentPostFile & { url: string };

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
];

const TABS = [
  { id: "pending", label: "Pendentes" },
  { id: "approved", label: "Aprovados" },
  { id: "scheduled", label: "Agendados" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Board({
  posts,
  filesByPost,
  role,
  bufferReady,
}: {
  posts: ContentPost[];
  filesByPost: Record<string, FileWithUrl[]>;
  role: MemberRole;
  bufferReady: boolean;
}) {
  const [tab, setTab] = useState<TabId>("pending");
  const [showUpload, setShowUpload] = useState(false);
  const [openPost, setOpenPost] = useState<ContentPost | null>(null);

  const isReviewer = role === "master" || role === "approval_only";
  const canSchedule = role === "master" || role === "full";
  const canSubmit = role === "master" || role === "full";

  const grouped = useMemo(() => {
    return {
      pending: posts.filter((p) => p.status === "pending"),
      approved: posts.filter((p) => p.status === "approved"),
      scheduled: posts.filter((p) => p.status === "scheduled" || p.status === "published"),
    };
  }, [posts]);

  const current = grouped[tab];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Aprovação de posts</h1>
          <p className="text-sm text-slate-500">Envie, aprove e agende para Instagram e TikTok</p>
        </div>
        {canSubmit && (
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Enviar post
          </button>
        )}
      </div>

      {!bufferReady && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          O agendamento automático (Buffer) ainda não está configurado — aprovar e organizar
          funciona normalmente, só o botão "Agendar" vai avisar que falta a chave.
        </p>
      )}

      {showUpload && canSubmit && <UploadForm onDone={() => setShowUpload(false)} />}

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-slate-400">({grouped[t.id].length})</span>
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">Nada por aqui ainda.</p>
      ) : tab === "pending" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {current.map((post) => (
            <GridTile key={post.id} post={post} files={filesByPost[post.id] ?? []} onOpen={() => setOpenPost(post)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {current.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              files={filesByPost[post.id] ?? []}
              canSchedule={canSchedule}
              onOpen={() => setOpenPost(post)}
            />
          ))}
        </div>
      )}

      {openPost && (
        <PostDetail
          post={openPost}
          files={filesByPost[openPost.id] ?? []}
          isReviewer={isReviewer}
          canSchedule={canSchedule}
          onClose={() => setOpenPost(null)}
        />
      )}
    </div>
  );
}

function GridTile({
  post,
  files,
  onOpen,
}: {
  post: ContentPost;
  files: FileWithUrl[];
  onOpen: () => void;
}) {
  const cover = files[0];
  return (
    <button
      onClick={onOpen}
      className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group"
    >
      {cover ? (
        cover.file_type === "video" ? (
          <video src={cover.url} className="h-full w-full object-cover" muted />
        ) : (
          <img src={cover.url} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <div className="h-full w-full flex items-center justify-center text-slate-300">📄</div>
      )}
      {files.length > 1 && (
        <span className="absolute top-1.5 right-1.5 text-white text-xs bg-black/50 rounded-full px-1.5 py-0.5">
          {files.length}
        </span>
      )}
      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
    </button>
  );
}

function PostRow({
  post,
  files,
  canSchedule,
  onOpen,
}: {
  post: ContentPost;
  files: FileWithUrl[];
  canSchedule: boolean;
  onOpen: () => void;
}) {
  const cover = files[0];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 flex gap-3 items-center">
      <button onClick={onOpen} className="shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-slate-100">
        {cover &&
          (cover.file_type === "video" ? (
            <video src={cover.url} className="h-full w-full object-cover" muted />
          ) : (
            <img src={cover.url} alt="" className="h-full w-full object-cover" />
          ))}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">{post.caption || "(sem legenda)"}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {post.target_platforms.map((p) => (
            <span key={p} className="text-xs bg-slate-100 rounded-full px-2 py-0.5 text-slate-500">
              {PLATFORMS.find((x) => x.id === p)?.icon} {p}
            </span>
          ))}
          {post.status === "scheduled" && post.scheduled_at && (
            <span className="text-xs text-green-700">
              {new Date(post.scheduled_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
      {post.status === "approved" && canSchedule && (
        <button
          onClick={onOpen}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
        >
          Agendar
        </button>
      )}
    </div>
  );
}

function PostDetail({
  post,
  files,
  isReviewer,
  canSchedule,
  onClose,
}: {
  post: ContentPost;
  files: FileWithUrl[];
  isReviewer: boolean;
  canSchedule: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(post.target_platforms);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const file = files[index];

  function doReview(approve: boolean) {
    startTransition(async () => {
      await reviewPost(post.id, approve, note);
      onClose();
    });
  }

  function doSchedule() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await schedulePost(post.id, new Date(scheduledAt).toISOString(), platforms);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function togglePlatform(id: string) {
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <div className="relative bg-black aspect-square">
          {file &&
            (file.file_type === "video" ? (
              <video src={file.url} className="h-full w-full object-contain" controls />
            ) : (
              <img src={file.url} alt="" className="h-full w-full object-contain" />
            ))}
          {files.length > 1 && (
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
              {files.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {post.caption && <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.caption}</p>}

          <div className="flex items-center gap-1.5">
            {post.target_platforms.map((p) => (
              <span key={p} className="text-xs bg-slate-100 rounded-full px-2 py-0.5 text-slate-500">
                {PLATFORMS.find((x) => x.id === p)?.icon} {p}
              </span>
            ))}
          </div>

          {post.status === "pending" && isReviewer && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Comentário (opcional)"
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <button
                  disabled={isPending}
                  onClick={() => doReview(true)}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  ✅ Aprovar
                </button>
                <button
                  disabled={isPending}
                  onClick={() => doReview(false)}
                  className="flex-1 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  ❌ Reprovar
                </button>
              </div>
            </div>
          )}

          {post.status === "approved" && canSchedule && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {!scheduling ? (
                <button
                  onClick={() => setScheduling(true)}
                  className="w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Agendar publicação
                </button>
              ) : (
                <>
                  <div className="flex gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                          platforms.includes(p.id)
                            ? "border-brand-600 bg-brand-50 text-brand-700"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button
                    disabled={isPending || !scheduledAt || platforms.length === 0}
                    onClick={doSchedule}
                    className="w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isPending ? "Agendando..." : "Confirmar agendamento"}
                  </button>
                </>
              )}
            </div>
          )}

          {post.status === "rejected" && (
            <p className="text-sm text-red-600">Reprovado{post.review_note ? `: ${post.review_note}` : "."}</p>
          )}

          {(post.status === "scheduled" || post.status === "published") && post.scheduled_at && (
            <p className="text-sm text-green-700">
              Agendado para{" "}
              {new Date(post.scheduled_at).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}

          <button
            onClick={() => startTransition(() => deletePost(post.id).then(onClose))}
            className="text-xs text-slate-300 hover:text-red-600"
          >
            excluir post
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const [caption, setCaption] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [previews, setPreviews] = useState<{ url: string; isVideo: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setPreviews(
      arr.map((f) => ({ url: URL.createObjectURL(f), isVideo: f.type.startsWith("video") }))
    );
  }

  function togglePlatform(id: string) {
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function submit() {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Selecione ao menos um arquivo.");
      return;
    }
    if (platforms.length === 0) {
      setError("Escolha pelo menos uma plataforma.");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("caption", caption);
    platforms.forEach((p) => fd.append("platforms", p));
    Array.from(files).forEach((f) => fd.append("files", f));

    startTransition(async () => {
      const result = await submitPost(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="text-sm"
      />
      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {previews.map((p, i) =>
            p.isVideo ? (
              <video key={i} src={p.url} className="h-20 w-20 object-cover rounded-lg" muted />
            ) : (
              <img key={i} src={p.url} alt="" className="h-20 w-20 object-cover rounded-lg" />
            )
          )}
        </div>
      )}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Legenda"
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => togglePlatform(p.id)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              platforms.includes(p.id)
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-500"
            }`}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? "Enviando..." : "Enviar para aprovação"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
