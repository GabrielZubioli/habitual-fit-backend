# Banco de dados — Migrations

## Onde ficam

`supabase/migrations/*.sql`. Nome no padrão Supabase: `<timestamp>_<slug>.sql`.
Hoje há sete, **todas aplicadas** no banco remoto:

1. `20260723143527_a57c0280-...` — schema completo: enums, tabelas, RLS, policies
   de Storage, triggers/funções e **seeds** (~71 exercícios e ~25 alimentos).
2. `20260723143546_5c5bf549-...` — hardening de permissões: `REVOKE`/`GRANT` de
   `EXECUTE` em `handle_new_user` e `has_role`.
3. `20260728000000_create_progress_photos_bucket` — bucket privado das fotos.
4. `20260729120000_add_data_integrity_constraints` — `CHECK` de faixa em 11 tabelas.
5. `20260729140000_add_superset_group_to_workout_sets` — superséries na sessão.
6. `20260729160000_add_workout_routines` — rotinas (divisão A/B/C com sequência).
7. `20260729180000_add_exercise_media` — `video_url`, `image_url` e `cues`.

Conferir o estado a qualquer momento com `npx supabase migration list`: cada
migration deve ter `local` **e** `remote` preenchidos.

`project_id` do Supabase em [supabase/config.toml](../../supabase/config.toml):
`nursxzqagxmeiucsaqzm` (projeto **"Sofit"** no painel — o app se chama Habitual Fit;
os nomes divergem por razões históricas).

## Como criar/rodar (fluxo Supabase CLI)

Confirmado na prática: o fluxo é a **Supabase CLI via `npx`**, com o projeto já
vinculado (`supabase/.temp/linked-project.json`). Não é preciso instalar nada
globalmente nem declarar a CLI no `package.json`.

```sh
# vincular ao projeto remoto (já feito neste repo; usa o project_id do config.toml)
npx supabase link --project-ref nursxzqagxmeiucsaqzm

# criar uma nova migration vazia
npx supabase migration new nome_da_mudanca
#  -> gera supabase/migrations/<timestamp>_nome_da_mudanca.sql (edite o SQL)

# aplicar as migrations no banco remoto
npx supabase db push

# conferir o que já está aplicado
npx supabase migration list

# (opcional) rodar localmente com Docker
supabase start
supabase db reset   # recria o banco local aplicando todas as migrations + seeds
```

## Regenerar os tipos TypeScript

`src/integrations/supabase/types.ts` é gerado do schema. Após alterar tabelas:

```sh
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

Nunca editar `types.ts` à mão (é sobrescrito).

> ⚠️ **Use `--linked`, não `--project-id <ref>`.** O `--linked` lê o `project_id`
> de [supabase/config.toml](../../supabase/config.toml), então não há ref para
> errar. Isso importa porque o `>` do shell **esvazia o arquivo antes** de o
> comando rodar: com um ref errado, o comando falha e você fica com um
> `types.ts` de 0 bytes, o que quebra o build inteiro (`File ... is not a
module`). Já aconteceu neste projeto.
>
> Se acontecer, o conserto é rodar de novo com `--linked`.
>
> Alternativa mais segura, que só sobrescreve em caso de sucesso:
>
> ```sh
> npx supabase gen types typescript --linked > /tmp/types.ts && \
>   mv /tmp/types.ts src/integrations/supabase/types.ts
> ```

## Convenções ao escrever migrations neste projeto

Seguir o que já existe na migration 1:

- Toda tabela nova: `ENABLE ROW LEVEL SECURITY` + policies (padrões em [rls.md](rls.md)).
- `GRANT` mínimo para `authenticated`, `GRANT ALL` para `service_role`.
- `created_at`/`updated_at TIMESTAMPTZ DEFAULT now()`; para `updated_at`, criar
  trigger `BEFORE UPDATE ... EXECUTE FUNCTION public.tg_set_updated_at()`.
- Preferir **soft delete** (`deleted_at TIMESTAMPTZ`) onde o app já usa (exercises,
  foods, templates, sessions, recipes) e filtrar `deleted_at IS NULL` na policy de SELECT.
- Funções que tocam dados de outros usuários (ex.: trigger de signup): `SECURITY
DEFINER SET search_path = public`, com `EXECUTE` revogado de `anon`/`public`.

## ⚠️ Importante — Lovable

Este projeto é gerenciado pelo **Lovable** (ver [AGENTS.md](../../AGENTS.md)).
Mudanças de schema feitas pela plataforma Lovable geram migrations automaticamente e
sincronizam via Git. **Não reescrever histórico Git publicado** (sem force-push /
rebase de commits já enviados), pois isso corrompe o histórico do lado do Lovable.
