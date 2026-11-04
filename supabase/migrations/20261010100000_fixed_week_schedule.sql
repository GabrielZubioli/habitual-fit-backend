-- Agenda por dia da semana, além da rotação.
--
-- Rotação (padrão, como era): as divisões seguem A → B → C a cada treino
-- concluído; os dias da semana são só guia.
-- Semana fixa: cada divisão tem os dias em que é feita (`weekdays`); um dia
-- pode ter mais de uma divisão e um dia sem nenhuma é descanso.
ALTER TABLE public.workout_routines
  ADD COLUMN IF NOT EXISTS schedule_mode TEXT NOT NULL DEFAULT 'rotation';
ALTER TABLE public.workout_routines
  DROP CONSTRAINT IF EXISTS workout_routines_schedule_mode_valid,
  ADD CONSTRAINT workout_routines_schedule_mode_valid
    CHECK (schedule_mode IN ('rotation', 'fixed'));

-- 0 = domingo … 6 = sábado, como `Date.getDay()` e `training_weekdays`.
ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS weekdays SMALLINT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.workout_templates
  DROP CONSTRAINT IF EXISTS workout_templates_weekdays_valid,
  ADD CONSTRAINT workout_templates_weekdays_valid
    CHECK (weekdays <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::SMALLINT[]);
