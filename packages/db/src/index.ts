/**
 * @gabrielzubioli/db — o contrato de dados do Habitual Fit.
 *
 * Este pacote é a **fonte única de verdade** sobre a forma dos dados. Ele é
 * gerado a partir do Postgres (`npm run db:types`) e publicado versionado; web e
 * mobile o consomem como dependência. Mudança de schema → regenera → bump →
 * os apps atualizam. Sem cópia manual, sem divergência.
 *
 * ## Dois "Database" diferentes
 *
 * Há duas noções de schema aqui, e confundi-las é a fonte de bug mais provável:
 *
 * | Export | O que é | Quem usa |
 * | --- | --- | --- |
 * | `Database` | Schema do **Postgres**, gerado por `supabase gen types` | `createClient<Database>()` no web e no mobile |
 * | `LocalDatabase` | Schema do **SQLite local** do PowerSync | consultas offline no mobile |
 *
 * O Postgres tem enums, views, funções e tipos exatos; o SQLite local só tem
 * text/integer/real. São formas diferentes do mesmo dado, então cada um tem seu
 * nome — `Database` continua sendo o do Postgres porque é o que o
 * `@supabase/supabase-js` espera receber.
 *
 * ## Subpaths (importe o mais estreito que servir)
 *
 * - `@gabrielzubioli/db/types` — só os tipos do Postgres. **Zero dependência de runtime**.
 * - `@gabrielzubioli/db/schema` — `AppSchema` do PowerSync. Requer `@powersync/common`.
 * - `@gabrielzubioli/db` — este barrel, que reexporta os dois.
 *
 * O app web deve importar de `@gabrielzubioli/db/types`: ele não usa PowerSync, e o
 * barrel arrastaria `@powersync/common` para o bundle sem necessidade.
 *
 * As sync rules ficam em `sync/streams.yaml` (publicadas na instância PowerSync).
 */

// Contrato do Postgres — sem dependência de runtime.
// As extensões `.js` são obrigatórias: o build emite ESM resolvido por Node e
// Metro (`moduleResolution: NodeNext`), que não adivinha extensão.
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./types.js";
export { Constants } from "./types.js";

// Schema local do PowerSync — requer `@powersync/common`.
export { AppSchema } from "./schema.js";
export type { Database as LocalDatabase } from "./schema.js";
