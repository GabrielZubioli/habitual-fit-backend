/**
 * Valida `packages/db/sync/streams.yaml` contra o schema local do PowerSync.
 *
 * ## O que esta validação pega
 *
 * As sync rules e o `AppSchema` são dois arquivos que precisam concordar, e nada
 * força isso: dá para adicionar uma tabela ao schema local e esquecer de
 * sincronizá-la (a tabela existe no device e nunca recebe dado), ou sincronizar
 * uma tabela que o schema local não declara (o dado desce e é descartado em
 * silêncio). Os dois casos falham em runtime, no device, longe do commit que os
 * causou. Aqui eles falham no `verify`.
 *
 * Não substitui o validador do dashboard do PowerSync — o SQL das queries só é
 * verificado de verdade contra o Postgres. Isto checa forma e cobertura.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

import { AppSchema } from "../packages/db/dist/index.js";
import { lerTabelas } from "../packages/db/scripts/build-powersync-schema.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STREAMS = join(ROOT, "packages", "db", "sync", "streams.yaml");

const erros = [];
const avisos = [];

const doc = parse(readFileSync(STREAMS, "utf8"));

if (doc?.config?.edition !== 3) {
  erros.push(`config.edition deve ser 3 (achei: ${JSON.stringify(doc?.config?.edition)}).`);
}

const streams = doc?.streams;
if (!streams || typeof streams !== "object") {
  erros.push("Bloco 'streams' ausente ou malformado.");
}

/** Tabelas citadas em `FROM <tabela>` / `JOIN <tabela>`, sem os aliases. */
const citadas = new Set();

for (const [nome, stream] of Object.entries(streams ?? {})) {
  const queries = stream?.queries;
  if (!Array.isArray(queries) || queries.length === 0) {
    erros.push(`Stream '${nome}' não tem queries.`);
    continue;
  }
  for (const q of queries) {
    if (typeof q !== "string" || !/^\s*SELECT\b/i.test(q)) {
      erros.push(`Stream '${nome}': query não começa com SELECT → ${JSON.stringify(q)}`);
      continue;
    }
    for (const m of q.matchAll(/\b(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*)/gi)) {
      citadas.add(m[1].toLowerCase());
    }
  }
}

const declaradas = new Set(AppSchema.tables.map((t) => t.name));

// O PowerSync exige `id` em toda linha: tabela de chave composta (sem coluna
// `id` no Postgres) precisa de um `... AS id` derivado da chave natural, senão
// o deploy das regras falha — ou as linhas somem no aparelho.
const colunas = lerTabelas(readFileSync(join(ROOT, "packages", "db", "src", "types.ts"), "utf8"));
for (const stream of Object.values(streams ?? {})) {
  for (const q of stream?.queries ?? []) {
    const m = /^\s*SELECT\s+([\s\S]*?)\s+FROM\s+([a-z_][a-z0-9_]*)/i.exec(q);
    if (!m) continue;
    const [, campos, tabela] = m;
    if (colunas[tabela] && !("id" in colunas[tabela]) && !/\bAS\s+id\b/i.test(campos)) {
      erros.push(
        `'${tabela}' não tem coluna id: a query precisa de "... AS id" → ${JSON.stringify(q)}`,
      );
    }
  }
}

for (const t of citadas) {
  if (!declaradas.has(t)) {
    erros.push(
      `streams.yaml sincroniza '${t}', que não existe no AppSchema (dado desceria e seria descartado).`,
    );
  }
}
for (const t of declaradas) {
  // `profiles` é filtrada por `id` (é a PK = auth.uid()), não por `user_id`;
  // ainda assim aparece no FROM, então a checagem abaixo vale para todas.
  if (!citadas.has(t)) {
    avisos.push(
      `AppSchema declara '${t}', mas nenhuma stream a sincroniza (tabela ficaria sempre vazia no device).`,
    );
  }
}

for (const a of avisos) console.warn(`aviso: ${a}`);
for (const e of erros) console.error(`erro: ${e}`);

if (erros.length > 0) {
  console.error(`\n${erros.length} erro(s) em streams.yaml.`);
  process.exit(1);
}
console.log(
  `streams.yaml OK — edition 3, ${Object.keys(streams).length} stream(s), ` +
    `${citadas.size}/${declaradas.size} tabelas do AppSchema cobertas` +
    (avisos.length ? `, ${avisos.length} aviso(s)` : ""),
);
