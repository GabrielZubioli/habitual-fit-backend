-- Proteção contra abuso: ninguém cria registros em massa.
--
-- 1. Limite de escrita por pessoa e por tabela, por minuto (contador em
--    `private.write_throttle`). Inserções em lote legítimas (gerar o plano,
--    materializar o dia da dieta) cabem com folga; um script em loop não.
-- 2. Teto total por pessoa nas tabelas de "coisas" (rotinas, planos, receitas,
--    exercícios, alimentos...), para ninguém encher o banco com uma conta só.
-- 3. Teto global de cadastros: mais de 30 contas novas em 10 minutos é ataque,
--    não crescimento. O limite por IP fica na configuração do Auth.
-- 4. Tamanho máximo para texto, listas e JSON escritos pelo app.
-- 5. Exercício/alimento criado pela pessoa não pode virar público — senão
--    qualquer conta publicaria nomes para todas as outras.
-- 6. Uma meta ativa por métrica (refazer o questionário duplicava as metas).
--
-- Escritas sem `auth.uid()` (service role, migrações, funções do servidor)
-- passam direto: o alvo são requisições vindas do cliente.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.write_throttle (
  user_id uuid not null,
  tbl text not null,
  minute timestamptz not null,
  n integer not null default 0,
  primary key (user_id, tbl, minute)
);

create or replace function private.throttle_writes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  por_minuto integer := TG_ARGV[0]::integer;
  teto integer := nullif(TG_ARGV[1], '')::integer;
  dono text := coalesce(nullif(TG_ARGV[2], ''), 'user_id');
  feitos integer;
  total integer;
begin
  if uid is null then
    return new;
  end if;

  insert into private.write_throttle as w (user_id, tbl, minute, n)
  values (uid, TG_TABLE_NAME, date_trunc('minute', clock_timestamp()), 1)
  on conflict (user_id, tbl, minute) do update set n = w.n + 1
  returning w.n into feitos;

  if feitos > por_minuto then
    raise exception 'Muitas operações seguidas. Aguarde um minuto e tente de novo.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  if teto is not null and TG_OP = 'INSERT' then
    execute format('select count(*) from public.%I where %I = $1', TG_TABLE_NAME, dono)
      into total using uid;
    if total >= teto then
      raise exception 'Limite de registros desta conta atingido.'
        using errcode = 'P0001', hint = 'quota_exceeded';
    end if;
  end if;

  -- Faxina ocasional: contadores com mais de uma hora não servem para nada.
  if random() < 0.01 then
    delete from private.write_throttle where minute < clock_timestamp() - interval '1 hour';
  end if;

  return new;
end;
$$;

revoke all on function private.throttle_writes() from public, anon, authenticated;

-- tabela, escritas por minuto, teto total (vazio = sem teto), coluna do dono
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('workout_routines',            10,  '100',  'user_id'),
      ('workout_templates',           40,  '300',  'user_id'),
      ('workout_template_exercises',  300, '',     ''),
      ('workout_sessions',            60,  '',     ''),
      ('workout_sets',                200, '',     ''),
      ('meal_plans',                  10,  '200',  'user_id'),
      ('meal_plan_meals',             60,  '',     ''),
      ('meal_plan_items',             400, '',     ''),
      ('food_log_entries',            200, '',     ''),
      ('diet_days',                   60,  '',     ''),
      ('recipes',                     20,  '300',  'user_id'),
      ('recipe_items',                300, '',     ''),
      ('exercises',                   20,  '300',  'owner_id'),
      ('exercise_muscles',            100, '',     ''),
      ('foods',                       30,  '1000', 'owner_id'),
      ('food_favorites',              60,  '1000', 'user_id'),
      ('food_substitution_prefs',     60,  '',     ''),
      ('goals',                       20,  '100',  'user_id'),
      ('progress_photos',             20,  '1000', 'user_id'),
      ('body_measurements',           10,  '',     ''),
      ('body_weights',                20,  '',     ''),
      ('water_intake',                30,  '',     ''),
      ('user_meal_slots',             30,  '',     ''),
      ('ai_conversations',            10,  '500',  'user_id'),
      ('ai_messages',                 30,  '',     ''),
      ('ai_recommendations',          60,  '',     ''),
      ('onboarding_answers',          60,  '',     ''),
      ('profiles',                    30,  '',     '')
    ) as t(tbl, por_minuto, teto, dono)
  loop
    execute format('drop trigger if exists throttle_writes on public.%I', r.tbl);
    execute format(
      'create trigger throttle_writes before insert or update on public.%I
         for each row execute function private.throttle_writes(%L, %L, %L)',
      r.tbl, r.por_minuto, r.teto, r.dono
    );
  end loop;
end;
$$;

-- 3. Teto global de cadastros -------------------------------------------------
create or replace function private.limit_signups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- ponytail: teto global, não por IP (o IP não chega ao banco); o limite por IP
  -- é o do Auth. Se o app crescer, subir o número ou trocar por captcha.
  if (select count(*) from auth.users where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Muitos cadastros agora. Tente de novo em alguns minutos.'
      using errcode = 'P0001', hint = 'signup_flood';
  end if;
  return new;
end;
$$;

revoke all on function private.limit_signups() from public, anon, authenticated;

drop trigger if exists limit_signups on auth.users;
create trigger limit_signups before insert on auth.users
  for each row execute function private.limit_signups();

-- 4. Tamanho máximo -----------------------------------------------------------
-- Textos longos por natureza ganham mais espaço; o resto, 2.000 caracteres.
-- Se algum dado antigo já passar do limite, o limite daquela coluna sobe até
-- ele (a restrição nunca quebra uma linha existente ao ser editada).
do $$
declare
  r record;
  limite integer;
  maior integer;
  nome text;
begin
  for r in
    select c.table_name, c.column_name, c.data_type
    from information_schema.columns c
    join pg_tables t on t.schemaname = 'public' and t.tablename = c.table_name
    where c.table_schema = 'public'
      and c.data_type in ('text', 'jsonb', 'ARRAY')
      and c.table_name not in ('subscriptions')
  loop
    nome := left(r.table_name || '_' || r.column_name, 50) || '_tamanho';
    execute format('alter table public.%I drop constraint if exists %I', r.table_name, nome);

    if r.data_type = 'text' then
      limite := case
        when r.column_name in ('content', 'instructions', 'body') then 20000
        when r.column_name in ('notes', 'prep_notes') then 4000
        else 2000
      end;
      execute format('select coalesce(max(char_length(%I)), 0) from public.%I', r.column_name, r.table_name)
        into maior;
      execute format(
        'alter table public.%I add constraint %I check (char_length(%I) <= %s)',
        r.table_name, nome, r.column_name, greatest(limite, maior)
      );
    elsif r.data_type = 'jsonb' then
      execute format('select coalesce(max(pg_column_size(%I)), 0) from public.%I', r.column_name, r.table_name)
        into maior;
      execute format(
        'alter table public.%I add constraint %I check (pg_column_size(%I) <= %s)',
        r.table_name, nome, r.column_name, greatest(65536, maior)
      );
    else
      execute format('select coalesce(max(cardinality(%I)), 0) from public.%I', r.column_name, r.table_name)
        into maior;
      execute format(
        'alter table public.%I add constraint %I check (cardinality(%I) <= %s)',
        r.table_name, nome, r.column_name, greatest(100, maior)
      );
    end if;
  end loop;
end;
$$;

-- 5. Nada criado pela pessoa vira público --------------------------------------
drop policy if exists "insert own exercise" on public.exercises;
create policy "insert own exercise" on public.exercises
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_public);

drop policy if exists "update own exercise" on public.exercises;
create policy "update own exercise" on public.exercises
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and not is_public);

drop policy if exists "insert own food" on public.foods;
create policy "insert own food" on public.foods
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_public);

drop policy if exists "update own food" on public.foods;
create policy "update own food" on public.foods
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and not is_public);

-- 6. Uma meta ativa por métrica -------------------------------------------------
create unique index if not exists idx_goals_one_active_per_metric
  on public.goals (user_id, metric_key)
  where is_active;

-- Fotos de progresso: só imagem, até 10 MB.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'progress-photos';
