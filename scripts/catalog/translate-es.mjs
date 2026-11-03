/**
 * Tradução do passo a passo dos exercícios do catálogo — para espanhol e, onde
 * faltar, para português. Em lote, com revisão por amostragem antes do push.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... \
 *     node scripts/catalog/translate-es.mjs [--amostra 20]
 *
 * Pré-requisito: a migration `20261103120000_exercicios_espanhol.sql` aplicada
 * (o filtro usa a coluna `name_es`).
 *
 * Lê do banco (só leitura) os exercícios públicos sem `name_es` e, para cada um:
 * - **tem passo a passo em português** (`execution`): traduz nome e passos
 *   para espanhol a partir dele (pt e es são próximos; o pt já foi revisado);
 * - **não tem**: parte do original em inglês (`execution_en` ou, na falta, o
 *   texto corrido `instructions`) e gera os passos em português **e** em
 *   espanhol, com o mesmo número de passos nos dois.
 *
 * Por que o segundo caso existe: a migration `20261015130000` gravava o
 * português pelo `id`, mas os ids eram de um projeto Supabase que não existe
 * mais — no projeto atual 819 de 880 exercícios ficaram sem pt.
 *
 * Grava `supabase/migrations/<timestamp>_exercicios_traducao_dados.sql`. Com
 * `--amostra N`, traduz só N e grava em `scripts/catalog/.amostra-es.sql`, para
 * ler antes de gastar com o catálogo inteiro.
 *
 * Retomável: cada lote vai para `scripts/catalog/.cache-es.json` (fora do git).
 * Não sobrescreve nada: o pt só entra onde `execution` está vazio, o es só
 * onde `name_es` é nulo.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CACHE = join(RAIZ, "scripts", "catalog", ".cache-es.json");
const LOTE = 10;
const MODELO = "claude-opus-5-5";

const INSTRUCOES = `Você traduz o catálogo de exercícios de musculação de um app fitness.

Cada exercício chega com:
- "nome": o nome em português do Brasil (já revisado);
- "origem": "pt" ou "en", o idioma do texto de execução;
- "passos": a lista de passos de execução, OU "texto": um parágrafo corrido em inglês.

Devolva para cada exercício, com o mesmo id:
- "nome_es": o nome em espanhol;
- "passos_es": os passos em espanhol;
- "passos_pt": os passos em português do Brasil — SÓ quando a origem é "en" (quando é "pt", devolva lista vazia).

Regras de fidelidade (é instrução de execução com carga; um erro pode machucar):
- Traduza o que está escrito. Não acrescente cargas, ângulos, cuidados ou dicas que não estejam no original, e não omita nenhum.
- Quando vier "passos", cada passo vira um passo, na mesma ordem: mesmo número de itens em todas as listas.
- Quando vier "texto", divida-o em passos curtos e claros (de 2 a 8), na ordem do texto, sem informação nova; "passos_pt" e "passos_es" têm o mesmo número de itens e se correspondem um a um.
- Mantenha números, graus, tempos e medidas como estão — exceto unidades americanas, que viram métricas com valor aproximado e arredondado ("two feet" → "uns 60 cm"; "150 lb" → "68 kg"; "10 yards" → "uns 9 m").
- A única coisa que pode sair: remissões a outras partes do site de origem que não existem no app ("veja a seção de posicionamento dos pés", "como descrito no guia"). Reescreva a frase sem a remissão, sem mudar a instrução.

Estilo:
- Português do Brasil, frases curtas no imperativo ("Deite no banco", "Segure a barra").
- Espanhol neutro (latino-americano), entendido também na Espanha, no imperativo com "tú" ("Acuéstate", "Sujeta", "Baja").
- Vocabulário de academia: Halteres → mancuernas; Barra → barra; Polia → polea; Máquina → máquina; Banco → banco; Anilha → disco; Elástico → banda elástica; Bola suíça → pelota suiza; Agachamento → sentadilla; Supino → press de banca; Remada → remo; Rosca → curl; Desenvolvimento → press de hombros; Puxada → jalón; Avanço → zancada; Levantamento terra → peso muerto; Panturrilha → pantorrilla; Prancha → plancha; Flexão de braço → flexión de brazos; Série → serie; Repetição → repetición; Carga → peso.
- Termos que já ficaram em inglês no nome em português (Leg Press, Face Pull, Push Press, Hack, Stiff, Smith, Kettlebell, Pullover, Crossover…) continuam em inglês.
- "nome_es" curto, no estilo de app ("Press de banca con barra"), com maiúscula só no início e em nomes próprios.`;

const Saida = z.object({
  exercicios: z.array(
    z.object({
      id: z.string(),
      nome_es: z.string(),
      passos_es: z.array(z.string()),
      passos_pt: z.array(z.string()),
    }),
  ),
});

function env(nome) {
  const v = process.env[nome];
  if (!v) {
    console.error(`Defina ${nome}.`);
    process.exit(1);
  }
  return v;
}

/** Exercícios públicos ainda sem espanhol, direto do PostgREST (só leitura). */
async function carregar() {
  const url = env("SUPABASE_URL").replace(/\/$/, "");
  const chave = env("SUPABASE_SERVICE_ROLE_KEY");
  const todos = [];
  for (let de = 0; ; de += 1000) {
    const res = await fetch(
      `${url}/rest/v1/exercises?select=id,name,execution,execution_en,instructions&is_public=eq.true&deleted_at=is.null&name_es=is.null&order=id`,
      { headers: { apikey: chave, Authorization: `Bearer ${chave}`, Range: `${de}-${de + 999}` } },
    );
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const pagina = await res.json();
    todos.push(...pagina);
    if (pagina.length < 1000) return todos;
  }
}

/** O que vai para o modelo: o português quando existe, senão o original em inglês. */
function entradaDe(e) {
  if (e.execution?.length) return { id: e.id, nome: e.name, origem: "pt", passos: e.execution };
  if (e.execution_en?.length)
    return { id: e.id, nome: e.name, origem: "en", passos: e.execution_en };
  if (e.instructions?.trim())
    return { id: e.id, nome: e.name, origem: "en", texto: e.instructions.trim() };
  return { id: e.id, nome: e.name, origem: "pt", passos: [] }; // só o nome
}

async function traduzir(client, lote) {
  const entrada = lote.map(entradaDe);
  const resposta = await client.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(Saida) },
    system: INSTRUCOES,
    messages: [{ role: "user", content: JSON.stringify({ exercicios: entrada }) }],
  });
  if (resposta.stop_reason !== "end_turn") {
    throw new Error(`lote interrompido: stop_reason=${resposta.stop_reason}`);
  }
  const saida = resposta.parsed_output;
  if (!saida) throw new Error("resposta sem JSON válido");

  // Confere o que voltou contra o que foi: mesmo id e passos que se correspondem.
  const porId = new Map(saida.exercicios.map((e) => [e.id, e]));
  return entrada.map((e) => {
    const t = porId.get(e.id);
    if (!t) throw new Error(`faltou o exercício ${e.id} (${e.nome})`);
    if (!t.nome_es.trim()) throw new Error(`${e.nome}: nome vazio`);
    if (e.passos && t.passos_es.length !== e.passos.length) {
      throw new Error(
        `${e.nome}: ${e.passos.length} passos na origem, ${t.passos_es.length} em es`,
      );
    }
    if (e.origem === "en") {
      if (t.passos_pt.length !== t.passos_es.length) {
        throw new Error(
          `${e.nome}: ${t.passos_pt.length} passos em pt, ${t.passos_es.length} em es`,
        );
      }
      if (e.texto && (t.passos_es.length < 1 || t.passos_es.length > 8)) {
        throw new Error(`${e.nome}: ${t.passos_es.length} passos a partir do texto corrido`);
      }
    }
    return { id: e.id, origem: e.origem, ...t, passos_pt: e.origem === "en" ? t.passos_pt : [] };
  });
}

const sql = (s) => `'${s.replace(/'/g, "''")}'`;
const lista = (passos) => (passos.length ? `array[${passos.map(sql).join(", ")}]` : "null");

function migration(traducoes) {
  const linhas = traducoes.flatMap((t) => [
    ...(t.passos_pt.length
      ? [
          `update public.exercises set execution = ${lista(t.passos_pt)} where id = ${sql(t.id)} and coalesce(cardinality(execution), 0) = 0;`,
        ]
      : []),
    `update public.exercises set name_es = ${sql(t.nome_es)}, execution_es = ${lista(t.passos_es)} where id = ${sql(t.id)} and name_es is null;`,
  ]);
  return [
    "-- Passo a passo em português onde faltava (a migration 20261015130000 casava",
    "-- por ids de um projeto que não existe mais) e nome e passo a passo em",
    "-- espanhol, gerados por scripts/catalog/translate-es.mjs. Não sobrescreve:",
    "-- o pt só entra onde `execution` está vazio, o es só onde `name_es` é nulo.",
    ...linhas,
    "",
  ].join("\n");
}

const amostra = process.argv.includes("--amostra")
  ? Number(process.argv[process.argv.indexOf("--amostra") + 1] || 20)
  : null;

const client = new Anthropic();
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
let exercicios = await carregar();
if (amostra) exercicios = exercicios.slice(0, amostra);
// O cache antigo (só espanhol, sem `nome_es`) não serve para este formato.
const faltam = exercicios.filter((e) => !cache[e.id]?.nome_es);
const semPt = exercicios.filter((e) => !e.execution?.length).length;
console.log(
  `${exercicios.length} exercícios sem espanhol (${semPt} também sem passo a passo em pt); ${faltam.length} a traduzir.`,
);

for (let i = 0; i < faltam.length; i += LOTE) {
  const lote = faltam.slice(i, i + LOTE);
  for (const t of await traduzir(client, lote)) cache[t.id] = t;
  writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  console.log(`  ${Math.min(i + LOTE, faltam.length)}/${faltam.length}`);
}

const prontos = exercicios.map((e) => cache[e.id]).filter((t) => t?.nome_es);
const agora = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
// A amostra fica fora das migrations: é para ler, não para aplicar.
const destino = amostra
  ? join(RAIZ, "scripts", "catalog", ".amostra-es.sql")
  : join(RAIZ, "supabase", "migrations", `${agora}_exercicios_traducao_dados.sql`);
writeFileSync(destino, migration(prontos));
console.log(`Gravado: ${destino} (${prontos.length} exercícios).`);
console.log("Revise uma amostra antes do `npx supabase db push`.");
