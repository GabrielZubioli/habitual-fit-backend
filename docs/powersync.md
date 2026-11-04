# PowerSync — configurar a instância

O app nativo funciona offline com o PowerSync: o aparelho guarda um SQLite com
os dados da pessoa (e o catálogo) e as escritas vão para uma fila que sobe
quando há conexão. Este guia liga a instância ao Postgres do Supabase.

## 1. Publicação (migration)

`supabase/migrations/20261101100000_powersync_publication.sql` cria a
publicação `powersync`. Sobe com o resto: `npm run db:push`.

## 2. Papel de replicação (à mão, uma vez)

No SQL Editor do Supabase, com uma senha forte gerada na hora (guarde num
gerenciador de senhas — ela vai no dashboard do PowerSync e em mais nenhum
lugar):

```sql
create role powersync_role with replication bypassrls login password '<senha>';
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;
```

Só leitura: quem escreve é o app, pelo PostgREST, com o RLS de sempre.

## 3. Instância no dashboard do PowerSync

1. Crie a instância em [dashboard.powersync.com](https://dashboard.powersync.com).
2. **Database connection**: Postgres do Supabase (host do _connection pooler_
   desligado — use a conexão direta, porta 5432), usuário `powersync_role` e a
   senha do passo 2.
3. **Client auth**: marque _Use Supabase Auth_ (o projeto usa as chaves JWT
   novas; deixe o campo de segredo vazio).
4. **Sync streams**: cole `packages/db/sync/streams.yaml` e faça o deploy.
5. Copie a URL da instância (`https://<id>.powersync.journeyapps.com`).

### A instância atual

Projeto `Habitual-Fit`, instância `Production` (região `br`):
`https://6ae8e8f5b0047aeb6df90c2b.powersync.journeyapps.com`. Conexão e
streams podem ir pelo CLI em vez do dashboard (`npx powersync`, com um token em
`PS_ADMIN_TOKEN`):

```sh
npx powersync pull instance --instance-id=6ae8e8f5b0047aeb6df90c2b   # cria powersync/
cp packages/db/sync/streams.yaml powersync/sync-config.yaml
npx powersync deploy sync-config
```

O `deploy` valida as streams contra o banco e acusa, por exemplo, tabela com
apelido no `FROM` (a linha iria para uma tabela com o nome do apelido).

## 4. No app

`EXPO_PUBLIC_POWERSYNC_URL=<url>` em `apps/mobile/.env` (desenvolvimento) e no
perfil `base` do `apps/mobile/eas.json` (builds). Sem essa variável o app segue
online, exatamente como antes.

## Quando o schema mudar

`npm run db:types` regenera os tipos **e** o schema local do PowerSync
(`packages/db/src/schema.ts`). Tabela nova que o app usa: entra em `TABELAS`
de `packages/db/scripts/build-powersync-schema.mjs` e ganha uma query em
`streams.yaml`. `npm run verify` acusa schema desatualizado, tabela sem stream
e tabela de chave composta sem `... AS id`. Depois: publicar o
`@gabrielzubioli/db` e fazer o deploy das streams no dashboard.
