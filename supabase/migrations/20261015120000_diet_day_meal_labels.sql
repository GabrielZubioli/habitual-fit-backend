-- Nome de refeição só de um dia do diário ("Não, somente hoje").
--
-- O nome que vale para a semana toda continua em meal_plan_meals.label. Este
-- é a exceção de uma data: { "<meal_slot>": "<nome>" }, chaveado pelo slot da
-- refeição (identificador estável), nunca pelo nome.
alter table public.diet_days
  add column if not exists meal_labels jsonb not null default '{}'::jsonb;

alter table public.diet_days
  drop constraint if exists diet_days_meal_labels_valido;
alter table public.diet_days
  add constraint diet_days_meal_labels_valido
  check (jsonb_typeof(meal_labels) = 'object' and pg_column_size(meal_labels) <= 4000);
