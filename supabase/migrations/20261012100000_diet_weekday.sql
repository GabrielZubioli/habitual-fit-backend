-- Cardápio por dia da semana.
--
-- Cada item do plano alimentar pode valer para todos os dias (weekday nulo,
-- o comportamento de até aqui) ou só para um dia (0 = domingo … 6 = sábado).
-- Ao montar um dia do diário, entram os itens "todo dia" mais os daquele dia.
alter table public.meal_plan_items
  add column if not exists weekday smallint check (weekday between 0 and 6);

comment on column public.meal_plan_items.weekday is
  'Dia da semana em que o item vale (0 = domingo); nulo = todos os dias.';
