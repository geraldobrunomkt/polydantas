"use server";

import { requireMember } from "@/lib/session";
import { generateJSON, type ChatTurn } from "@/lib/gemini";

export type AgendaDraft = {
  item_date: string | null;
  item_time: string | null;
  location: string | null;
  title: string | null;
  description: string | null;
  content_idea: string | null;
  reply: string;
};

const SCHEMA = {
  type: "object",
  properties: {
    item_date: { type: "string", nullable: true, description: "Data no formato YYYY-MM-DD" },
    item_time: { type: "string", nullable: true, description: "Hora no formato HH:MM (24h)" },
    location: { type: "string", nullable: true },
    title: { type: "string", nullable: true, description: "Título curto do compromisso" },
    description: { type: "string", nullable: true, description: "Detalhes da programação" },
    content_idea: { type: "string", nullable: true, description: "Ideia de conteúdo para gravar/postar" },
    reply: { type: "string", description: "Resposta curta e natural confirmando o que foi entendido, em português" },
  },
  required: ["reply"],
};

function systemPrompt(): string {
  const table = nextDaysTable(14);
  return `Você organiza a agenda semanal de uma campanha política brasileira.
O usuário escreve de forma corrida e desorganizada, e você extrai os campos estruturados.

Use ESTA TABELA para resolver qualquer dia da semana ou data relativa mencionada (não calcule de
cabeça, apenas consulte a linha correspondente); nunca use uma data que já passou:
${table}

Só preencha um campo se tiver informação pra isso; deixe null se não souber.
Nunca invente local, horário ou título que não foram mencionados.
No campo "reply", responda em 1-2 frases curtas e naturais confirmando o que você entendeu, em tom direto e amigável. Se faltar alguma informação importante (data ou título), pergunte por ela no "reply".`;
}

export async function organizeAgendaText(
  history: ChatTurn[],
  message: string
): Promise<AgendaDraft | { error: string }> {
  await requireMember("agenda");
  if (!message.trim()) return { error: "Escreva alguma coisa primeiro." };

  try {
    return await generateJSON<AgendaDraft>({
      system: systemPrompt(),
      history,
      message,
      schema: SCHEMA,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao falar com a IA." };
  }
}

export type AgendaItemDraft = {
  item_date: string;
  item_time: string | null;
  location: string | null;
  title: string;
  description: string | null;
  content_idea: string | null;
};

export type AgendaBulkResult = { items: AgendaItemDraft[]; reply: string };

const BULK_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      description: "Um item para cada compromisso/dia identificado no texto",
      items: {
        type: "object",
        properties: {
          item_date: { type: "string", description: "Data no formato YYYY-MM-DD" },
          item_time: { type: "string", nullable: true, description: "Hora no formato HH:MM (24h)" },
          location: { type: "string", nullable: true },
          title: { type: "string", description: "Título curto do compromisso" },
          description: { type: "string", nullable: true, description: "Detalhes da programação" },
          content_idea: { type: "string", nullable: true, description: "Ideia de conteúdo para gravar/postar" },
        },
        required: ["item_date", "title"],
      },
    },
    reply: {
      type: "string",
      description: "Resposta curta confirmando quantos compromissos foram entendidos, em português",
    },
  },
  required: ["items", "reply"],
};

function nextDaysTable(days: number): string {
  const rows: string[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
    rows.push(`${iso} = ${weekday}${i === 0 ? " (hoje)" : ""}`);
  }
  return rows.join("\n");
}

function bulkSystemPrompt(): string {
  const table = nextDaysTable(21);
  return `Você organiza a agenda semanal de uma campanha política brasileira.
O usuário vai colar ou ditar a agenda de vários dias de uma vez, de forma corrida e desorganizada
(pode ser lista, texto corrido, com ou sem pontuação). Sua tarefa é separar em UM ITEM POR
COMPROMISSO e extrair os campos estruturados de cada um.

Use ESTA TABELA para resolver qualquer dia da semana ou data mencionada (não calcule de cabeça,
apenas consulte a linha correspondente):
${table}

Regras de data, sigra à risca:
- Os compromissos normalmente são descritos em ordem cronológica no texto. A lista final de
  item_date deve ficar em ordem crescente (nunca decrescente) na mesma ordem em que os
  compromissos aparecem no texto.
- Se o texto mencionar um dia da semana que já apareceu antes na mesma lista (ex: "segunda" e
  depois outra "segunda"), use a PRÓXIMA ocorrência desse dia na tabela (a que vem depois do
  último item já processado), nunca repita a mesma data para dias da semana diferentes.
- Se uma data explícita for dada (ex: "dia 22"), use-a como âncora e resolva os dias da semana
  seguintes a partir dela adiante, consultando a tabela.
- Nunca use uma data que já passou.

Só preencha local/hora/ideia de conteúdo se a informação estiver no texto; deixe null se não souber.
Nunca invente informação que não foi mencionada.
Todo item PRECISA ter item_date e title - se não for possível determinar a data de um trecho, não
crie item para ele e mencione isso no "reply".
No campo "reply", diga em 1-2 frases quantos compromissos você entendeu, em tom direto e amigável.`;
}

export async function organizeAgendaBulk(
  message: string
): Promise<AgendaBulkResult | { error: string }> {
  await requireMember("agenda");
  if (!message.trim()) return { error: "Cole ou escreva a agenda da semana primeiro." };

  try {
    return await generateJSON<AgendaBulkResult>({
      system: bulkSystemPrompt(),
      history: [],
      message,
      schema: BULK_SCHEMA,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao falar com a IA." };
  }
}
