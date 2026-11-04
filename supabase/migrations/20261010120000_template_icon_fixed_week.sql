-- Ícone escolhido para cada rotina (no lugar da letra A/B/C) e fim da rotação.
--
-- O app passou a ter só a semana fixa: cada rotina tem os seus dias. As
-- rotinas que ainda estão em rotação ganham dias distribuídos em sequência
-- pelos dias de treino que já tinham (A no 1º, B no 2º, … e de novo A), que é
-- exatamente o que a rotação mostrava para a semana corrente.

ALTER TABLE public.workout_templates
  ADD COLUMN icon TEXT
  CHECK (icon IS NULL OR icon ~ '^[a-z-]{1,32}$');

COMMENT ON COLUMN public.workout_templates.icon IS
  'Ícone da rotina no app (chave do catálogo do front, ex.: "braco", "perna"). NULL = escolhido pelo nome.';

WITH alvo AS (
  SELECT
    t.id,
    row_number() OVER (PARTITION BY t.routine_id ORDER BY t.routine_order, t.created_at) - 1 AS i,
    count(*) OVER (PARTITION BY t.routine_id) AS n,
    coalesce(nullif(r.training_weekdays, '{}'), '{1,3,5}') AS dias
  FROM public.workout_templates t
  JOIN public.workout_routines r ON r.id = t.routine_id
  WHERE r.schedule_mode = 'rotation'
    AND t.deleted_at IS NULL
)
UPDATE public.workout_templates t
SET weekdays = coalesce(
  (
    SELECT array_agg(d ORDER BY k)
    FROM unnest(alvo.dias) WITH ORDINALITY AS u(d, k)
    WHERE (k - 1) % alvo.n = alvo.i
  ),
  '{}'
)
FROM alvo
WHERE t.id = alvo.id
  AND t.weekdays = '{}';

UPDATE public.workout_routines SET schedule_mode = 'fixed' WHERE schedule_mode = 'rotation';

ALTER TABLE public.workout_routines ALTER COLUMN schedule_mode SET DEFAULT 'fixed';
