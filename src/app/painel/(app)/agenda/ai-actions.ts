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
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekday = now.toLocaleDateString("pt-BR", { weekday: "long" });
  return `Você organiza a agenda semanal de uma campanha política brasileira.
O usuário escreve de forma corrida e desorganizada, e você extrai os campos estruturados.
Hoje é ${weekday}, ${today}. Resolva datas relativas ("quinta", "amanhã", "semana que vem") com base nisso, sempre para o próximo dia correspondente a partir de hoje.
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
