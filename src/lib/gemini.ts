import "server-only";

const MODEL = "gemini-2.5-flash";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurado.");
  return key;
}

export type ChatTurn = { role: "user" | "model"; text: string };

export async function generateJSON<T>(opts: {
  system: string;
  history: ChatTurn[];
  message: string;
  schema: object;
}): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey()}`;

  const contents = [
    ...opts.history.map((t) => ({
      role: t.role,
      parts: [{ text: t.text }],
    })),
    { role: "user", parts: [{ text: opts.message }] },
  ];

  const body = {
    system_instruction: { parts: [{ text: opts.system }] },
    contents,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: opts.schema,
    },
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Resposta vazia da IA.");
        return JSON.parse(text) as T;
      }

      if (res.status === 503 || res.status === 429) {
        lastError = await res.text();
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }

      throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") {
        lastError = "tempo esgotado";
        continue;
      }
      throw e;
    }
  }

  throw new Error(`IA indisponível no momento, tente de novo. (${lastError})`);
}
