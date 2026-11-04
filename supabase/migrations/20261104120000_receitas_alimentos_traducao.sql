-- Nome e medida caseira dos alimentos e nome e modo de preparo das receitas
-- em inglês e espanhol, para o app em en/es.
--
-- Nulos até serem preenchidos: o app cai no português quando a coluna está
-- vazia (e avisa com o selo "em português"). Só texto: nenhum valor
-- nutricional, grama ou ingrediente muda. Os dados chegam numa migration
-- separada, gerada a partir das colunas em português.
alter table public.foods
  add column if not exists name_en text,
  add column if not exists name_es text,
  add column if not exists household_measure_en text,
  add column if not exists household_measure_es text;

comment on column public.foods.name_en is 'Nome em inglês (app em en). Nulo = usa o nome em português.';
comment on column public.foods.name_es is 'Nome em espanhol (app em es). Nulo = usa o nome em português.';
comment on column public.foods.household_measure_en is 'Medida caseira em inglês. Nulo = usa household_measure.';
comment on column public.foods.household_measure_es is 'Medida caseira em espanhol. Nulo = usa household_measure.';

alter table public.recipes
  add column if not exists name_en text,
  add column if not exists name_es text,
  add column if not exists instructions_en text,
  add column if not exists instructions_es text;

comment on column public.recipes.name_en is 'Nome em inglês (app em en). Nulo = usa o nome em português.';
comment on column public.recipes.name_es is 'Nome em espanhol (app em es). Nulo = usa o nome em português.';
comment on column public.recipes.instructions_en is 'Modo de preparo em inglês. Nulo = usa instructions.';
comment on column public.recipes.instructions_es is 'Modo de preparo em espanhol. Nulo = usa instructions.';

-- A busca do app em en/es procura também por estas colunas (como o
-- idx_foods_name_trgm faz com o nome em português).
create index if not exists idx_foods_name_en_trgm
  on public.foods using gin (name_en gin_trgm_ops)
  where name_en is not null;
create index if not exists idx_foods_name_es_trgm
  on public.foods using gin (name_es gin_trgm_ops)
  where name_es is not null;

-- O teto de tamanho da proteção contra abuso (20261011120000) só cobriu as
-- colunas que existiam então: alimento e receita da pessoa são escritos pelo
-- app, e as colunas novas ganham o mesmo limite das irmãs em português.
alter table public.foods
  drop constraint if exists foods_name_en_tamanho,
  add constraint foods_name_en_tamanho check (char_length(name_en) <= 2000),
  drop constraint if exists foods_name_es_tamanho,
  add constraint foods_name_es_tamanho check (char_length(name_es) <= 2000),
  drop constraint if exists foods_household_measure_en_tamanho,
  add constraint foods_household_measure_en_tamanho check (char_length(household_measure_en) <= 2000),
  drop constraint if exists foods_household_measure_es_tamanho,
  add constraint foods_household_measure_es_tamanho check (char_length(household_measure_es) <= 2000);

alter table public.recipes
  drop constraint if exists recipes_name_en_tamanho,
  add constraint recipes_name_en_tamanho check (char_length(name_en) <= 2000),
  drop constraint if exists recipes_name_es_tamanho,
  add constraint recipes_name_es_tamanho check (char_length(name_es) <= 2000),
  drop constraint if exists recipes_instructions_en_tamanho,
  add constraint recipes_instructions_en_tamanho check (char_length(instructions_en) <= 20000),
  drop constraint if exists recipes_instructions_es_tamanho,
  add constraint recipes_instructions_es_tamanho check (char_length(instructions_es) <= 20000);
