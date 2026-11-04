-- Nome e passo a passo dos exercícios em espanhol, para o app em es.
--
-- Nulos até serem preenchidos: o app cai no português (mais próximo do
-- espanhol que o inglês) quando a coluna está vazia. Os dados chegam numa
-- migration separada, gerada a partir das colunas em português.
alter table public.exercises
  add column if not exists name_es text,
  add column if not exists execution_es text[];

comment on column public.exercises.name_es is 'Nome em espanhol (app em es). Nulo = usa o nome em português.';
comment on column public.exercises.execution_es is 'Passo a passo em espanhol (app em es). Nulo = usa execution.';

-- A busca do app em espanhol procura também por esta coluna.
create index if not exists idx_exercises_name_es_trgm
  on public.exercises using gin (name_es gin_trgm_ops)
  where name_es is not null;
