-- Excluir a conta precisa funcionar (exigência da App Store e direito do
-- usuário na LGPD). Apagar `auth.users` desce em cascata por tudo que é do
-- usuário — mas um exercício ou alimento **próprio** já usado em treino/dieta
-- travava a cascata: as FKs abaixo eram RESTRICT, checadas no meio dela, antes
-- de as séries e entradas que os referenciam serem apagadas.
--
-- DEFERRABLE INITIALLY DEFERRED leva a checagem para o commit. A integridade
-- continua garantida: apagar diretamente um exercício em uso ainda falha, só
-- que no fim da transação.

ALTER TABLE public.workout_sets
  DROP CONSTRAINT workout_sets_exercise_id_fkey,
  ADD CONSTRAINT workout_sets_exercise_id_fkey FOREIGN KEY (exercise_id)
    REFERENCES public.exercises(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.workout_template_exercises
  DROP CONSTRAINT workout_template_exercises_exercise_id_fkey,
  ADD CONSTRAINT workout_template_exercises_exercise_id_fkey FOREIGN KEY (exercise_id)
    REFERENCES public.exercises(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.food_log_entries
  DROP CONSTRAINT food_log_entries_food_id_fkey,
  ADD CONSTRAINT food_log_entries_food_id_fkey FOREIGN KEY (food_id)
    REFERENCES public.foods(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.recipe_items
  DROP CONSTRAINT recipe_items_food_id_fkey,
  ADD CONSTRAINT recipe_items_food_id_fkey FOREIGN KEY (food_id)
    REFERENCES public.foods(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.meal_plan_items
  DROP CONSTRAINT meal_plan_items_food_id_fkey,
  ADD CONSTRAINT meal_plan_items_food_id_fkey FOREIGN KEY (food_id)
    REFERENCES public.foods(id) DEFERRABLE INITIALLY DEFERRED;
