/**
 * Gera `src/schema.ts` (o schema local do PowerSync) a partir de `src/types.ts`
 * (os tipos gerados do Postgres). Antes o schema era escrito à mão e ficou
 * para trás: `profiles` sem metade das colunas, tabelas novas fora, tabelas
 * que nunca existiram dentro. Gerado, ele acompanha cada `db:types`.
 *
 *   node scripts/build-powersync-schema.mjs          # grava src/schema.ts
 *   node scripts/build-powersync-schema.mjs --check  # falha se estiver desatualizado
 *
 * Tipos locais do PowerSync: text / integer / real.
 *  - string, enums, datas, uuid, arrays e JSON → text (arrays e JSON chegam
 *    como texto JSON e são lidos com `JSON.parse`)
 *  - number → real
 *  - boolean → integer (0/1)
 * A coluna `id` é implícita no PowerSync e não é declarada.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/** As tabelas que descem para o aparelho, com os índices locais de cada uma. */
export const TABELAS = {
  profiles: {},
  user_roles: {},
  onboarding_answers: {},
  goals: { user: ["user_id"] },
  exercises: { owner: ["owner_id"], primary: ["primary_muscle"], equipment: ["equipment"] },
  exercise_muscles: { exercise: ["exercise_id"] },
  exercise_favorites: { user: ["user_id"] },
  workout_routines: { user: ["user_id"] },
  workout_templates: { user: ["user_id"], routine: ["routine_id"] },
  workout_template_exercises: { template: ["template_id"] },
  workout_sessions: { user_started: ["user_id", "started_at"] },
  workout_sets: { session: ["session_id"], exercise: ["exercise_id"] },
  foods: { name: ["name"], category: ["category"] },
  food_log_entries: { user_date: ["user_id", "log_date"] },
  food_substitution_prefs: { user_food: ["user_id", "food_id"] },
  water_intake: { user_date: ["user_id", "log_date"] },
  diet_days: { user_date: ["user_id", "log_date"] },
  meal_plans: { user: ["user_id"] },
  meal_plan_meals: { plan: ["plan_id"] },
  meal_plan_items: { meal: ["meal_id"] },
  recipes: { user: ["user_id"] },
  recipe_items: { recipe: ["recipe_id"] },
  body_weights: { user_date: ["user_id", "log_date"] },
  body_measurements: { user_date: ["user_id", "log_date"] },
  progress_photos: { user_date: ["user_id", "log_date"] },
};

/** Colunas `public.<tabela>.Row` do `types.ts`: nome → tipo TS (sem `| null`). */
export function lerTabelas(fonte) {
  const publico = fonte.slice(fonte.indexOf("  public: {"));
  const tabelas = {};
  for (const m of publico.matchAll(/\n {6}([a-z_]+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\};/g)) {
    tabelas[m[1]] = Object.fromEntries(
      m[2]
        .split("\n")
        .map((l) => l.trim().replace(/;$/, ""))
        .filter(Boolean)
        .map((l) => {
          const i = l.indexOf(":");
          return [
            l.slice(0, i),
            l
              .slice(i + 1)
              .trim()
              .replace(/\s*\|\s*null$/, ""),
          ];
        }),
    );
  }
  return tabelas;
}

export function tipoLocal(ts) {
  if (ts === "number") return "real";
  if (ts === "boolean") return "integer";
  return "text";
}

export function gerarSchema(fonte) {
  const tabelas = lerTabelas(fonte);
  const blocos = Object.entries(TABELAS).map(([nome, indices]) => {
    const colunas = tabelas[nome];
    if (!colunas) throw new Error(`Tabela "${nome}" não existe em src/types.ts`);
    const linhas = Object.entries(colunas)
      .filter(([c]) => c !== "id")
      .map(([c, t]) => `    ${c}: column.${tipoLocal(t)},`)
      .join("\n");
    const idx = Object.keys(indices).length
      ? `,\n  { indexes: { ${Object.entries(indices)
          .map(([k, v]) => `${k}: [${v.map((c) => `"${c}"`).join(", ")}]`)
          .join(", ")} } }`
      : "";
    return `const ${nome} = new Table(\n  {\n${linhas}\n  }${idx},\n);`;
  });
  // Colunas que no Postgres são array ou JSON e no SQLite viram texto JSON: o
  // app precisa saber quais converter de volta ao enviar as escritas.
  const json = Object.fromEntries(
    Object.keys(TABELAS)
      .map((nome) => [
        nome,
        Object.entries(tabelas[nome])
          .filter(([, t]) => t.endsWith("[]") || t === "Json")
          .map(([c]) => c),
      ])
      .filter(([, cols]) => cols.length > 0),
  );
  return `// GERADO por scripts/build-powersync-schema.mjs a partir de src/types.ts — não editar à mão.
import { column, Schema, Table } from "@powersync/common";

${blocos.join("\n\n")}

export const AppSchema = new Schema({
${Object.keys(TABELAS)
  .map((t) => `  ${t},`)
  .join("\n")}
});

export type Database = (typeof AppSchema)["types"];

/** Colunas array/JSON no Postgres (texto JSON no SQLite), por tabela. */
export const JSON_COLUMNS: Record<string, readonly string[]> = ${JSON.stringify(json, null, 2)};
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const gerado = gerarSchema(readFileSync(join(RAIZ, "src/types.ts"), "utf8"));
  const destino = join(RAIZ, "src/schema.ts");
  if (process.argv.includes("--check")) {
    if (readFileSync(destino, "utf8") !== gerado) {
      console.error(
        "src/schema.ts está desatualizado: rode `node scripts/build-powersync-schema.mjs`.",
      );
      process.exit(1);
    }
    console.log("src/schema.ts em dia.");
  } else {
    writeFileSync(destino, gerado);
    console.log(`src/schema.ts gerado: ${Object.keys(TABELAS).length} tabelas.`);
  }
}
