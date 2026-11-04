# habitual-fit-backend

Camada de dados e plataforma do Habitual Fit: schema do Postgres, RLS, Edge Functions,
geradores de catálogo e o contrato `@gabrielzubioli/db`.

Este repositório **não tem servidor de aplicação**, e isso é uma decisão, não uma
lacuna. Os apps falam direto com o Postgres via PostgREST, e o RLS é a fronteira
de segurança. Um proxy no meio adicionaria latência a cada leitura e quebraria a
sincronização offline do PowerSync, que precisa replicar do Postgres. A única
coisa que roda como servidor é a Edge Function `coach`, porque a chave da API de
IA não pode chegar ao navegador.

```
┌─────────────┐        PostgREST (RLS)        ┌──────────────┐
│  web/mobile │ ─────────────────────────────►│              │
│             │                               │   Postgres   │
│             │◄──── PowerSync (streams) ─────│  (Supabase)  │
└─────────────┘                               └──────────────┘
       │                                             ▲
       └──────► Edge Function `coach` ───────────────┘
                (valida JWT, guarda a chave da IA)
```

## Setup

```bash
npm install
cp .env.example .env      # preencha SUPABASE_ACCESS_TOKEN
npm run verify
```

O `project_id` do Supabase já está em `supabase/config.toml` e não é segredo —
os scripts o leem de lá. O `.env` guarda só o que é credencial de verdade.

## Scripts

| Script                   | O que faz                                             |
| ------------------------ | ----------------------------------------------------- |
| `npm run db:types`       | Regenera `packages/db/src/types.ts` do projeto remoto |
| `npm run db:types:local` | Idem, do banco local (requer Docker)                  |
| `npm run db:types:check` | Falha se os tipos versionados divergirem do banco     |
| `npm run db:push`        | Aplica as migrations pendentes                        |
| `npm run db:diff`        | Mostra o drift entre migrations e o banco             |
| `npm run db:lint`        | Lint do schema                                        |
| `npm run sync:validate`  | Valida `streams.yaml` contra o `AppSchema`            |
| `npm run db:build`       | Compila `@gabrielzubioli/db` para `dist/`             |
| `npm run db:publish`     | Publica `@gabrielzubioli/db` no registry              |
| `npm run verify`         | typecheck + sync:validate + build + format:check      |
| `npm run catalog:*`      | Regenera as migrations de seed do catálogo            |

## O contrato: `@gabrielzubioli/db`

É a única coisa que o frontend importa daqui. Contém os tipos gerados do Postgres
e o schema local do PowerSync, publicados como pacote versionado.

O ciclo é: **mudou o schema → `db:push` → `db:types` → bump de versão → publica →
o frontend atualiza a dependência.** Nada é copiado à mão, então os dois lados não
têm como divergir em silêncio.

Ver [`packages/db/README.md`](packages/db/README.md) para os subpaths (`/types`,
`/schema`) e por que existem dois tipos chamados `Database`.

### O que cada número da versão significa

Semver aqui fala sobre **compatibilidade de tipos**, não sobre o banco. A
pergunta que decide o número é sempre a mesma: _o app que compila contra a
versão anterior continua compilando?_

|           | Quando                      | Exemplo                                                                  |
| --------- | --------------------------- | ------------------------------------------------------------------------ |
| **patch** | Nada muda para quem consome | comentário, README, correção de build                                    |
| **minor** | Só adiciona                 | tabela nova, coluna nullable, valor novo num enum                        |
| **major** | Quebra quem consome         | coluna removida ou renomeada, tipo alterado, coluna que virou `NOT NULL` |

Um `major` é um aviso de que **algum arquivo do frontend vai parar de compilar**
— que é exatamente o ponto: o erro aparece no `tsc`, no PR, e não em produção
quando um `select` volta `undefined`.

Vale notar que a migration que remove uma coluna e o `major` que anuncia isso
são coisas separadas: o banco já mudou quando o pacote é publicado. Para
mudanças destrutivas, o caminho seguro continua sendo o de sempre — adicionar o
novo, migrar os apps, remover o velho numa segunda migration.

### Como publicar

Suba `version` em `packages/db/package.json` e mergeie na `main`. O workflow
[`publish-db.yml`](.github/workflows/publish-db.yml) publica e cria a tag
`db-v<versão>`.

O gatilho é o número da versão, não uma tag: se a versão já existe no registry,
o job termina sem fazer nada. Assim um commit que toca `packages/db/` sem mudar
o contrato (um README, por exemplo) não quebra o pipeline.

## CI

| Workflow                | Quando                              | O que faz                                                                                                       |
| ----------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ci.yml` → `verify`     | push/PR na main                     | typecheck, sync:validate, build, format                                                                         |
| `ci.yml` → `migrations` | push/PR na main                     | sobe um Postgres limpo, aplica todas as migrations, regenera os tipos e falha se o contrato versionado divergir |
| `publish-db.yml`        | push na main tocando `packages/db/` | publica se a versão for nova                                                                                    |

O job `migrations` é o que mais protege e **não usa segredo nenhum**: um
`supabase db start` aplica as migrations em ordem num banco vazio. Se uma
migration quebrou, falha ali; se alguém mudou o schema e esqueceu de rodar
`db:types`, o diff acusa. Sem ele, o primeiro erro apareceria no deploy e o
segundo em runtime, dentro do app.

## Migrations

Migrations são **imutáveis depois de aplicadas**. Para corrigir algo, escreva uma
nova. Editar uma migration já aplicada faz o histórico do repo divergir do estado
real do banco, e o `db:diff` passa a mentir.

As migrations de seed do catálogo (`*_seed_exercise_catalog.sql`,
`*_seed_food_catalog.sql`, `*_seed_exercise_library.sql`) são **geradas** pelos
scripts em `scripts/catalog/` e idempotentes. Não as edite à mão: rode o gerador.

Os caches dos geradores (`.cache-*.json`, ~19 MB) não são versionados — são
downloads das fontes externas e o script os refaz sozinho.

## Documentação

Em [`docs/`](docs/): schema, RLS, fluxo de migrations, autenticação e a visão
geral da arquitetura.
