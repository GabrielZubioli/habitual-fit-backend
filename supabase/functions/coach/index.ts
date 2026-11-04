/**
 * Treinador com IA — Edge Function.
 *
 * ## Por que existe um servidor no meio
 *
 * A chave da API **nunca** pode chegar ao navegador: qualquer usuário abriria o
 * DevTools e a copiaria. Esta função valida o JWT do Supabase, monta o contexto
 * lendo o banco **sob a identidade do usuário** (portanto respeitando RLS) e só
 * então chama o modelo.
 *
 * ## O que o modelo faz e o que não faz
 *
 * Ele **não decide números**. Treino, dieta, progressão, deload e detecção de
 * estagnação são produzidos pelo motor determinístico em `@forja/domain` — que
 * é testável, instantâneo e funciona offline. O modelo recebe esses resultados
 * já calculados e conversa sobre eles.
 *
 * A distinção não é estilística. Um modelo que inventa a prescrição prescreve
 * 30 séries de peito para um iniciante, e não há como testar se vai acontecer
 * de novo. Um modelo que explica a prescrição do motor é um treinador.
 *
 * ## Degradação
 *
 * Sem `ANTHROPIC_API_KEY` configurada, responde 503 com uma mensagem clara. O
 * app trata isso escondendo o chat — todo o resto continua funcionando.
 *
 * Implantar: `npx supabase functions deploy coach`
 * Configurar: `npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sonnet 5 sucede o Sonnet 4.5 que estava aqui — mesma faixa de custo e
 * latência, que é o que um chat de treinador precisa. Opus 5 está disponível se
 * um dia a conversa exigir mais capacidade; a troca é só esta constante.
 */
const MODEL = "claude-sonnet-5";

/**
 * Sonnet 5 pensa por padrão quando `thinking` é omitido — o Sonnet 4.5 não. Como
 * `max_tokens` limita pensamento **e** texto no mesmo teto, manter o 1024 de
 * antes cortaria a resposta no meio para caber o raciocínio. O teto subiu, e o
 * esforço é `low`: uma pergunta de treino não justifica deliberação longa, e a
 * latência é o que o usuário sente no chat.
 */
const MAX_TOKENS = 4096;
const EFFORT = "low";

/** Teto por mensagem, para uma conversa longa não estourar contexto nem custo. */
const MAX_HISTORY = 20;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json(
      {
        error: "unavailable",
        message:
          "O treinador com IA ainda não foi configurado neste projeto. Todo o resto do app funciona normalmente.",
      },
      503,
    );
  }

  // --- Autenticação -------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Não autenticado." }, 401);
  }

  // Client criado com o token do próprio usuário: todas as leituras abaixo
  // passam pelas policies de RLS. Usar a service role aqui seria mais simples e
  // abriria a porta para vazar dados de um usuário na conversa de outro.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: "Sessão inválida." }, 401);

  // --- Entrada ------------------------------------------------------------
  let body: { messages?: { role: string; content: string }[]; locale?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo inválido." }, 400);
  }

  const messages = (body.messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 4000) }));

  if (messages.length === 0 || messages.at(-1)?.role !== "user") {
    return json({ error: "Envie uma mensagem." }, 400);
  }

  // --- Contexto -----------------------------------------------------------
  const context = await buildContext(supabase);
  const idioma =
    IDIOMAS[
      String(body.locale ?? "")
        .slice(0, 2)
        .toLowerCase()
    ] ?? IDIOMAS.pt;

  // --- Chamada ao modelo --------------------------------------------------
  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: { effort: EFFORT },
        system: systemPrompt(context, idioma),
        messages,
        stream: true,
      }),
    });
  } catch {
    return json({ error: "Não foi possível falar com o treinador agora." }, 502);
  }

  if (!response.ok) {
    const detalhe = await response.text().catch(() => "");
    console.error("anthropic error", response.status, detalhe);
    // A mensagem crua da API pode conter detalhes de cobrança e configuração
    // que não interessam — nem deveriam aparecer — ao usuário final.
    return json(
      {
        error:
          response.status === 429
            ? "O treinador está ocupado. Tente de novo em alguns instantes."
            : "Não foi possível falar com o treinador agora.",
      },
      502,
    );
  }

  // O corpo da Anthropic é repassado direto ao browser, sem bufferizar. Esperar
  // a resposta inteira antes de devolver qualquer coisa é o que fazia o chat
  // parecer travado: numa resposta de alguns parágrafos são segundos olhando
  // para um cursor parado, e o texto já estava pronto no servidor.
  //
  // O formato SSE da Anthropic é repassado como está — o cliente lê os eventos
  // `content_block_delta` e concatena `delta.text`.
  if (!response.body) {
    return json({ error: "Não foi possível falar com o treinador agora." }, 502);
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Sem isto, um proxy intermediário pode acumular o corpo e entregar tudo
      // de uma vez — o que desfaz o streaming sem erro nenhum aparecer.
      "X-Accel-Buffering": "no",
    },
  });
});

// --------------------------------------------------------------------------

interface CoachContext {
  name: string | null;
  goal: string | null;
  kcalTarget: number | null;
  proteinTarget: number | null;
  daysPerWeek: number | null;
  injuries: string[];
  allergies: string[];
  restrictions: string[];
  weightKg: number | null;
  weightTrend: string | null;
  routineName: string | null;
  splits: string[];
  recentWorkouts: number;
  recentPrs: string[];
}

/**
 * Monta o retrato do usuário que o modelo recebe.
 *
 * Enviar **fatos, não a base inteira**: o modelo não precisa de 40 sessões de
 * treino para responder "posso trocar agachamento por leg press?", e mandá-las
 * custa tokens, latência e aumenta a chance de ele se perder em detalhe
 * irrelevante.
 */
async function buildContext(supabase: ReturnType<typeof createClient>): Promise<CoachContext> {
  const [profileRes, routineRes, weightsRes, sessionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, goal, daily_kcal_target, protein_g_target, days_per_week, injuries, allergies, dietary_restrictions",
      )
      .maybeSingle(),
    supabase
      .from("workout_routines")
      .select("name, workout_templates(name, routine_order)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("body_weights")
      .select("weight_kg, log_date")
      .order("log_date", { ascending: false })
      .limit(14),
    supabase
      .from("workout_sessions")
      .select("name, started_at")
      .not("ended_at", "is", null)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const p = profileRes.data as Record<string, unknown> | null;
  const pesos = (weightsRes.data ?? []) as { weight_kg: number; log_date: string }[];

  // Tendência simples: primeiro contra último da janela. O cálculo bom (EMA)
  // vive no domínio e roda no cliente; aqui só precisamos de uma frase.
  let tendencia: string | null = null;
  if (pesos.length >= 4) {
    const recente = Number(pesos[0]!.weight_kg);
    const antigo = Number(pesos[pesos.length - 1]!.weight_kg);
    const delta = recente - antigo;
    tendencia =
      Math.abs(delta) < 0.3
        ? "estável"
        : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg nas últimas ${pesos.length} pesagens`;
  }

  const routine = routineRes.data as {
    name: string;
    workout_templates?: { name: string; routine_order: number }[];
  } | null;

  return {
    name: (p?.display_name as string) ?? null,
    goal: (p?.goal as string) ?? null,
    kcalTarget: p?.daily_kcal_target ? Number(p.daily_kcal_target) : null,
    proteinTarget: p?.protein_g_target ? Number(p.protein_g_target) : null,
    daysPerWeek: p?.days_per_week ? Number(p.days_per_week) : null,
    injuries: (p?.injuries as string[]) ?? [],
    allergies: (p?.allergies as string[]) ?? [],
    restrictions: (p?.dietary_restrictions as string[]) ?? [],
    weightKg: pesos[0] ? Number(pesos[0].weight_kg) : null,
    weightTrend: tendencia,
    routineName: routine?.name ?? null,
    splits: (routine?.workout_templates ?? [])
      .sort((a, b) => a.routine_order - b.routine_order)
      .map((t) => t.name),
    recentWorkouts: (sessionsRes.data ?? []).length,
    recentPrs: [],
  };
}

/**
 * Em que idioma o treinador responde — o do app de quem pergunta. Os dados do
 * contexto (nomes de exercício, rótulos) continuam como estão no banco.
 */
const IDIOMAS: Record<string, string> = {
  pt: "Fale em português do Brasil",
  en: "Responda em inglês (inglês americano), mesmo que os dados abaixo estejam em português",
  es: 'Responda em espanhol neutro (latino-americano, tratando por "tú"), mesmo que os dados abaixo estejam em português',
};

function systemPrompt(ctx: CoachContext, idioma: string): string {
  const lista = (arr: string[]) => (arr.length ? arr.join(", ") : "nenhuma");

  return `Você é o treinador do Habitual Fit, um app brasileiro de musculação e nutrição. ${idioma}, na segunda pessoa, com tom direto e prático — como um bom personal trainer, não como um manual.

## Quem está falando com você

- Nome: ${ctx.name ?? "não informado"}
- Objetivo: ${ctx.goal ?? "não informado"}
- Peso atual: ${ctx.weightKg ? `${ctx.weightKg} kg` : "não registrado"}
- Tendência de peso: ${ctx.weightTrend ?? "sem dados suficientes"}
- Meta calórica: ${ctx.kcalTarget ? `${ctx.kcalTarget} kcal/dia` : "não definida"}
- Meta de proteína: ${ctx.proteinTarget ? `${ctx.proteinTarget} g/dia` : "não definida"}
- Frequência planejada: ${ctx.daysPerWeek ? `${ctx.daysPerWeek}x por semana` : "não definida"}
- Rotina ativa: ${ctx.routineName ?? "nenhuma"}${ctx.splits.length ? ` (${ctx.splits.join(" · ")})` : ""}
- Treinos concluídos recentemente: ${ctx.recentWorkouts}
- Lesões declaradas: ${lista(ctx.injuries)}
- Alergias: ${lista(ctx.allergies)}
- Restrições alimentares: ${lista(ctx.restrictions)}

## Regras que você não quebra

1. **Não invente números.** Os planos, metas e análises são calculados pelo app. Se te perguntarem algo que exige um número que não está acima, diga que não tem esse dado e indique onde no app ele aparece — não estime.

2. **Alergia é intransponível.** Nunca sugira alimento que contenha um alérgeno listado, nem como substituição, nem "em pequena quantidade".

3. **Lesão muda a prescrição.** Se a pessoa declarou lesão numa articulação, não recomende exercícios que a carreguem diretamente sem mencionar o cuidado.

4. **Você não é médico.** Dor persistente, tontura, lesão aguda ou qualquer sintoma clínico: recomende procurar um profissional de saúde. Não diagnostique, não trate, não sugira medicamento ou suplemento como remédio.

5. **Respostas curtas.** Duas a quatro frases resolvem quase tudo. Use lista só quando forem passos de verdade. Nada de introduções ("Ótima pergunta!") nem de resumos no fim.

6. **Fora do escopo.** Se perguntarem coisas sem relação com treino, alimentação, corpo ou o uso do app, diga em uma frase que não é o seu assunto e volte ao que você faz.

Quando não souber, diga que não sabe.`;
}
