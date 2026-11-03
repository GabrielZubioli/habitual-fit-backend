/**
 * Tradução dos exercícios do catálogo — português → espanhol, em lote.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... \
 *     node scripts/catalog/translate-es.mjs [--amostra 20]
 *
 * Pré-requisito: a migration `20261103120000_exercicios_espanhol.sql` aplicada
 * (o filtro usa a coluna `name_es`).
 *
 * Lê do banco (só leitura) os exercícios públicos sem `name_es`, traduz nome e
 * passo a passo com o Claude em lotes e grava uma migration de dados em
 * `supabase/migrations/<timestamp>_exercicios_espanhol_dados.sql` — que vai
 * para revisão (amostragem) antes do `db push`. Com `--amostra N`, traduz só
 * N exercícios e grava em `scripts/catalog/.amostra-es.sql`, para avaliar a
 * qualidade antes de gastar com o catálogo inteiro.
 *
 * ## Por que a partir do português, e não do inglês
 *
 * O passo a passo em português já foi revisado e adaptado (cargas, cuidados,
 * termos de academia); o texto em inglês é o da base de origem, cru. Português
 * e espanhol são próximos: a tradução perde menos.
 *
 * ## Retomável
 *
 * Cada lote traduzido vai para `scripts/catalog/.cache-es.json` (fora do
 * git). Se a rede cair no meio, rodar de novo continua de onde parou.
 *
 * A migration só preenche onde `name_es` ainda é nulo: rodar duas vezes, ou
 * depois de alguém corrigir uma tradução à mão, não sobrescreve nada.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CACHE = join(RAIZ, "scripts", "catalog", ".cache-es.json");
const LOTE = 25;
const MODELO = "claude-opus-5-5";

const INSTRUCOES = `Você traduz um catálogo de exercícios de musculação de um app fitness, do português do Brasil para o espanhol neutro (latino-americano).

Regras:
- Espanhol neutro, entendido em toda a América Latina e na Espanha. Passo a passo no imperativo com "tú" ("Acuéstate", "Sujeta", "Baja").
- Vocabulário de academia em espanhol: Halteres → mancuernas; Barra → barra; Polia → polea; Máquina → máquina; Banco → banco; Anilha → disco; Elástico → banda elástica; Bola suíça → pelota suiza; Agachamento → sentadilla; Supino → press de banca; Remada → remo; Rosca → curl; Desenvolvimento → press de hombros; Puxada → jalón; Avanço → zancada; Levantamento terra → peso muerto; Panturrilha → pantorrilla; Prancha → plancha; Flexão de braço → flexión de brazos; Abdominal → abdominal; Série → serie; Repetição → repetición; Carga → peso; Descanso → descanso.
- Termos que já ficaram em inglês no nome em português (Leg Press, Face Pull, Push Press, Hack, Stiff, Smith, Kettlebell, Pullover, Crossover…) continuam em inglês.
- Nomes curtos, no estilo de app ("Press de banca con barra", "Curl de bíceps con mancuernas"), com maiúscula só no início e em nomes próprios.
- Mantenha números, unidades, graus e medidas exatamente como estão.
- Traduza cada passo para um passo: a lista em espanhol tem o mesmo número de itens, na mesma ordem.
- Devolva todos os exercícios recebidos, com o mesmo id.`;

const Saida = z.object({
  exercicios: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      passos: z.array(z.string()),
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
      `${url}/rest/v1/exercises?select=id,name,execution&is_public=eq.true&deleted_at=is.null&name_es=is.null&order=id`,
      { headers: { apikey: chave, Authorization: `Bearer ${chave}`, Range: `${de}-${de + 999}` } },
    );
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const pagina = await res.json();
    todos.push(...pagina);
    if (pagina.length < 1000) return todos;
  }
}

async function traduzir(client, lote) {
  const entrada = lote.map((e) => ({ id: e.id, nome: e.name, passos: e.execution ?? [] }));
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

  // Confere o que voltou contra o que foi: mesmo id, mesmo número de passos.
  const porId = new Map(saida.exercicios.map((e) => [e.id, e]));
  for (const e of entrada) {
    const t = porId.get(e.id);
    if (!t) throw new Error(`faltou o exercício ${e.id} (${e.nome})`);
    if (t.passos.length !== e.passos.length) {
      throw new Error(`${e.nome}: ${e.passos.length} passos em pt, ${t.passos.length} em es`);
    }
    if (!t.nome.trim()) throw new Error(`${e.nome}: nome vazio`);
  }
  return entrada.map((e) => porId.get(e.id));
}

const sql = (s) => `'${s.replace(/'/g, "''")}'`;

function migration(traducoes) {
  const linhas = traducoes.map((t) => {
    const passos = t.passos.length ? `array[${t.passos.map(sql).join(", ")}]` : "null";
    return `update public.exercises set name_es = ${sql(t.nome)}, execution_es = ${passos} where id = ${sql(t.id)} and name_es is null;`;
  });
  return [
    "-- Nome e passo a passo em espanhol dos exercícios do catálogo, traduzidos do",
    "-- português por scripts/catalog/translate-es.mjs. Só preenche onde name_es é",
    "-- nulo: nada corrigido à mão é sobrescrito.",
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
const faltam = exercicios.filter((e) => !cache[e.id]);
console.log(`${exercicios.length} exercícios sem espanhol; ${faltam.length} a traduzir.`);

for (let i = 0; i < faltam.length; i += LOTE) {
  const lote = faltam.slice(i, i + LOTE);
  for (const t of await traduzir(client, lote)) cache[t.id] = t;
  writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  console.log(`  ${Math.min(i + LOTE, faltam.length)}/${faltam.length}`);
}

const prontos = exercicios.map((e) => cache[e.id]).filter(Boolean);
const agora = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
// A amostra fica fora das migrations: é para ler, não para aplicar.
const destino = amostra
  ? join(RAIZ, "scripts", "catalog", ".amostra-es.sql")
  : join(RAIZ, "supabase", "migrations", `${agora}_exercicios_espanhol_dados.sql`);
writeFileSync(destino, migration(prontos));
console.log(`Migration gravada: ${destino} (${prontos.length} exercícios).`);
console.log("Revise uma amostra antes do `npm run db:push`.");
