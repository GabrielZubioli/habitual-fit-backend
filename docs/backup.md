# Backup e saúde do banco

Dois workflows protegem o Postgres de produção (`habitual-fit`,
`batdlbdifjuyhnexuvbx`). O plano free do Supabase não tem backup baixável nem
alerta, e em 3/11 o banco antigo caiu sem backup nenhum.

Os dois usam o secret `SUPABASE_DB_URL`: a connection string do pooler em modo
sessão (`postgres.<ref>@aws-1-sa-east-1.pooler.supabase.com:5432`). A conexão
direta é só IPv6, e os runners do GitHub não têm IPv6.

## Backup diário — `.github/workflows/backup.yml`

Todo dia às 06:00 UTC (e sob demanda em Actions → Backup do banco → Run
workflow) gera os três arquivos do guia oficial do Supabase — `roles.sql`,
`schema.sql` e `data.sql` (este inclui `auth.users`) —, compacta e criptografa
para `.github/backup/certificado.pem`. O artifact `backup-<n>` fica 30 dias.

O job falha (e o GitHub manda e-mail) se algum arquivo vier menor que o mínimo
ou se `data.sql` não tiver `auth.users`.

**A chave privada não está no GitHub** — o repo é público e qualquer conta
logada baixa os artifacts. Ela fica no gerenciador de senhas, como
`habitual-fit-backup-chave-privada.pem`. Sem ela o backup não abre.

Não cobre os arquivos do Storage (fotos de progresso e de perfil) — só os
metadados em `storage.objects`. Também fica de fora o que o usuário `postgres`
não consegue reaplicar num projeto novo e o Supabase recria sozinho: o
`GRANT ... ON PARAMETER` do Realtime em `roles.sql` e as tabelas
`storage.buckets_vectors` e `storage.vector_indexes`.

Restauração testada em 3/11/2026 num Supabase local (Postgres 17.11, Auth
2.197): as 31 tabelas do `public` e `auth.users` voltaram com a mesma contagem de
linhas da produção.

### Restaurar

```bash
# 1. Baixar o artifact (ou pela página do run)
gh run download -R GabrielZubioli/habitual-fit-backend -n backup-<n>

# 2. Descriptografar e descompactar
openssl cms -decrypt -binary -inform DER -inkey chave-privada.pem \
  -in backup.tar.gz.cms | tar xzf -

# 3. Aplicar num projeto Supabase novo, numa transação só
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --command 'SET session_replication_role = replica' \
  --file schema.sql \
  --file data.sql \
  --dbname "postgresql://postgres.<ref-novo>:<senha>@<pooler>:5432/postgres"
```

Depois: recriar o slot e a publicação do PowerSync (`docs/powersync.md`) e
reaplicar `max_slot_wal_keep_size = 1GB`.

### Trocar a chave

```bash
openssl req -x509 -newkey rsa:4096 -nodes -days 36500 -subj "/CN=habitual-fit-backup" \
  -keyout chave-privada.pem -out .github/backup/certificado.pem
```

Backups antigos continuam abrindo só com a chave antiga.

## Saúde do banco — `.github/workflows/saude-do-banco.yml`

De hora em hora (minuto 17) roda uma consulta só-leitura e falha se:

| Verificação          | Limite                 | Por quê                                         |
| -------------------- | ---------------------- | ----------------------------------------------- |
| Slot do PowerSync    | não existe ou inativo  | foi o que derrubou o banco em 3/11              |
| `wal_status` do slot | `lost` / `unreachable` | o Supabase descartou o slot: vai ressincronizar |
| WAL retido pelo slot | > 300 MB               | ~40 min antes do limite de 1 GB                 |
| Tamanho do banco     | > 400 MB               | o free fica só-leitura em 500 MB                |
| Banco não responde   | 20 s                   | queda de qualquer tipo                          |

Para ver o alerta chegar: Run workflow com **testar_alerta** marcado (zera os
limites). O e-mail depende de github.com → Settings → Notifications → Actions
com "Only notify for failed workflows" ligado.

O GitHub desliga workflows agendados de repo público depois de 60 dias sem
commit. Se isso acontecer, chega um e-mail; é só reativar em Actions.
