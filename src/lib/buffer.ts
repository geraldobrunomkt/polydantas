import "server-only";

const BASE = "https://api.bufferapp.com/1";

function token(): string | null {
  return process.env.BUFFER_ACCESS_TOKEN || null;
}

export function bufferConfigured(): boolean {
  return !!token();
}

/**
 * IDs dos perfis conectados no Buffer (Instagram/TikTok), configurados via env var
 * BUFFER_PROFILE_IDS="instagram:xxxxx,tiktok:yyyyy"
 */
function profileIdsFor(platforms: string[]): string[] {
  const raw = process.env.BUFFER_PROFILE_IDS || "";
  const map = new Map<string, string>();
  for (const pair of raw.split(",")) {
    const [platform, id] = pair.split(":").map((s) => s.trim());
    if (platform && id) map.set(platform.toLowerCase(), id);
  }
  return platforms
    .map((p) => map.get(p.toLowerCase()))
    .filter((id): id is string => !!id);
}

export async function createBufferUpdates(opts: {
  platforms: string[];
  text: string;
  mediaUrls: string[];
  scheduledAtISO: string;
}): Promise<{ ids: string[] } | { error: string }> {
  const t = token();
  if (!t) return { error: "BUFFER_ACCESS_TOKEN não configurado." };

  const profileIds = profileIdsFor(opts.platforms);
  if (profileIds.length === 0) {
    return {
      error:
        "Nenhum perfil do Buffer encontrado para essas plataformas. Configure BUFFER_PROFILE_IDS.",
    };
  }

  const scheduledAt = Math.floor(new Date(opts.scheduledAtISO).getTime() / 1000);

  const form = new URLSearchParams();
  for (const id of profileIds) form.append("profile_ids[]", id);
  form.append("text", opts.text);
  form.append("scheduled_at", String(scheduledAt));
  if (opts.mediaUrls[0]) {
    form.append("media[photo]", opts.mediaUrls[0]);
    form.append("media[thumbnail]", opts.mediaUrls[0]);
  }

  const res = await fetch(`${BASE}/updates/create.json?access_token=${t}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!res.ok) {
    return { error: `Buffer API error ${res.status}: ${await res.text()}` };
  }

  const data = await res.json();
  const ids = (data.updates ?? []).map((u: { id: string }) => u.id);
  return { ids };
}
