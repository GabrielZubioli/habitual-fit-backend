# Banco de dados — Row Level Security (RLS)

RLS é o **mecanismo de segurança central** do Habitual Fit. Como a área logada fala direto
com o Supabase pelo client anon/publishable, é o banco (não a aplicação) que garante
que cada usuário só acesse os próprios dados. Todas as tabelas têm
`ENABLE ROW LEVEL SECURITY`.

Definições: migration [20260723143527_...sql](../../supabase/migrations/20260723143527_a57c0280-e41b-489c-9714-8ca03a8a4aeb.sql).

## Padrões de policy

Três padrões se repetem:

### 1. "Dono direto" (tabelas com `user_id`)

Ex.: `profiles`, `workout_sessions`, `workout_templates`, `food_log_entries`,
`recipes`, `body_weights`, `body_measurements`, `progress_photos`.

```sql
-- exemplo: workout_sessions
CREATE POLICY "own sessions" ON public.workout_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

`profiles` é a exceção na forma (PK = `id`): policies separadas de select/insert/update
usando `auth.uid() = id`. Não há policy de DELETE (perfil não é apagado pela app).

### 2. "Dono via pai" (tabelas-filhas, sem `user_id` próprio)

Ex.: `workout_template_exercises`, `workout_sets`, `recipe_items`. A policy faz
`EXISTS` na tabela-pai:

```sql
-- exemplo: workout_sets
CREATE POLICY "own sets" ON public.workout_sets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_sessions s
                 WHERE s.id = session_id AND s.user_id = auth.uid()))
  WITH CHECK (...);
```

### 3. "Público OU dono" (catálogos compartilhados)

Ex.: `exercises`, `foods`. Leitura de itens públicos **ou** do dono; escrita só do dono:

```sql
-- exemplo: exercises
CREATE POLICY "read exercises" ON public.exercises FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (is_public OR owner_id = auth.uid()));
CREATE POLICY "insert own exercise" ... WITH CHECK (owner_id = auth.uid());
-- update/delete idem, restritos a owner_id = auth.uid()
```

Note que a policy de SELECT já filtra `deleted_at IS NULL` — mesmo assim as queries
do app costumam repetir `.is("deleted_at", null)` por clareza.

## `user_roles`

Só permite ao usuário **ler os próprios papéis**:

```sql
CREATE POLICY "read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

Escrita só via `service_role`. A inserção do papel inicial é feita pelo trigger
`handle_new_user` (SECURITY DEFINER, contorna RLS).

## Storage (`storage.objects`) — bucket `progress-photos`

Isolamento pelo **primeiro segmento do path = uid** (por isso o app grava em
`<user_id>/...`):

```sql
CREATE POLICY "own photo read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
-- policies análogas para INSERT e DELETE
```

Como o bucket é privado, o app acessa via **signed URLs** (ver [modulos/corpo.md](../modulos/corpo.md)).

## Grants

Cada tabela concede o mínimo ao papel `authenticated` (ex.: `SELECT, INSERT, UPDATE,
DELETE`; `user_roles` só `SELECT`) e `ALL` ao `service_role`. Funções sensíveis têm
`EXECUTE` revogado de `anon`/`public` (migration 2).

## Papéis admin

Existe o papel `admin` e a função `has_role`, mas **nenhuma policy atual concede
acesso ampliado a admins** — todas gateiam por `auth.uid()`. Ou seja, hoje admin não
enxerga dados de terceiros. ⚠️ infra pronta, não utilizada.
