-- Remove de vez os exercícios importados do `hasaneyldrm/exercises-dataset`.
--
-- Eles estão escondidos desde 20260810160000_revert_gymvisual_media.sql
-- (soft delete) e o projeto não vai voltar a usar essa fonte. Eram 1.324
-- linhas que só ocupavam espaço e repetiam ~200 exercícios do catálogo curado.
--
-- `workout_sets` e `workout_template_exercises` referenciam `exercises` sem
-- cascata, então o `NOT EXISTS` garante que nenhum exercício usado num treino
-- seja apagado. Favoritos e músculos têm `ON DELETE CASCADE`. Em 03/11/2026
-- nenhum desses exercícios tinha referência alguma.
DELETE FROM public.exercises AS e
WHERE e.external_id LIKE 'gymvisual:%'
  AND e.deleted_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.workout_sets s WHERE s.exercise_id = e.id)
  AND NOT EXISTS (SELECT 1 FROM public.workout_template_exercises t WHERE t.exercise_id = e.id);

-- Dois exercícios do catálogo se chamavam "Supino Declinado no Smith". O de
-- pegada mais aberta que os ombros ganha o complemento no nome.
UPDATE public.exercises
SET name = 'Supino Declinado no Smith (Pegada Aberta)',
    name_es = 'Press declinado en Smith (agarre abierto)'
WHERE id = '8365a503-0192-4502-af33-ada2ceab778d';
